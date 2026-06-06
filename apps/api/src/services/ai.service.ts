import OpenAI from 'openai';
import { env } from '../config/env';
import { IResult } from '../models/Result';
import { Test } from '../models/Test';
import { isOpenRouterConfigured } from '../lib/ai/openrouter';

let openai: OpenAI | null = null;
let mentorClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai;
}

function getMentorClient(): OpenAI | null {
  if (!isOpenRouterConfigured()) return null;
  if (!mentorClient) {
    mentorClient = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': env.FRONTEND_URL,
        'X-Title': 'MentorsDaily AI Mentor',
      },
    });
  }
  return mentorClient;
}

export interface AIPerformanceInsight {
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  studyPlan: string[];
  suggestedTests: string[];
  suggestedTopics: string[];
}

export async function generatePerformanceAnalysis(
  result: IResult,
  testTitle: string
): Promise<AIPerformanceInsight> {
  const client = getOpenAI();

  const subjectSummary = result.subjectAnalysis
    .map((s) => `${s.subjectName}: ${s.accuracy}% accuracy (${s.correct}/${s.total})`)
    .join('\n');

  const fallback: AIPerformanceInsight = {
    strengths: result.subjectAnalysis
      .filter((s) => s.accuracy >= 70)
      .map((s) => `Strong in ${s.subjectName}`),
    weaknesses: result.subjectAnalysis
      .filter((s) => s.accuracy < 50)
      .map((s) => `Needs work in ${s.subjectName}`),
    improvementAreas: ['Revise weak topics', 'Practice timed mocks', 'Review incorrect answers'],
    studyPlan: [
      'Day 1-2: Revise weakest subject',
      'Day 3-4: Topic-wise practice',
      'Day 5-7: Full mock test',
    ],
    suggestedTests: [],
    suggestedTopics: result.topicAnalysis
      .filter((t) => t.accuracy < 60)
      .map((t) => t.topicName),
  };

  if (!client) return fallback;

  const prompt = `Analyze this test performance for "${testTitle}":
Score: ${result.score}/${result.maxScore} (${result.percentage}%)
Accuracy: ${result.accuracy}%
Correct: ${result.correctCount}, Wrong: ${result.wrongCount}, Unattempted: ${result.unattemptedCount}
Subject breakdown:
${subjectSummary}

Respond in JSON only with keys: strengths (array), weaknesses (array), improvementAreas (array), studyPlan (array of 5 day steps), suggestedTopics (array).`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert exam coach for Indian competitive exams (SSC, Banking, UPSC). Be concise and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800,
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
    const suggestedTests = await Test.find({ status: 'published' })
      .limit(3)
      .select('_id title')
      .lean();

    return {
      strengths: parsed.strengths ?? fallback.strengths,
      weaknesses: parsed.weaknesses ?? fallback.weaknesses,
      improvementAreas: parsed.improvementAreas ?? fallback.improvementAreas,
      studyPlan: parsed.studyPlan ?? fallback.studyPlan,
      suggestedTests: suggestedTests.map((t) => t._id.toString()),
      suggestedTopics: parsed.suggestedTopics ?? fallback.suggestedTopics,
    };
  } catch {
    return fallback;
  }
}

export async function chatWithMentor(
  _userId: string,
  message: string,
  context?: { questionText?: string; subject?: string }
): Promise<string> {
  const client = getMentorClient();
  if (!client) {
    return 'AI Mentor is temporarily unavailable. Please configure OPENROUTER_API_KEY.';
  }

  const systemPrompt = `You are MentorsDaily AI Mentor for Indian competitive exams (SSC, Banking, UPSC, Railway).
Help students understand concepts in simple Hindi-English mix (Hinglish) when helpful.

Format rules (IMPORTANT):
- Use short paragraphs with blank lines between sections
- Use bullet points with "- " for lists
- Use **bold** only for key terms (not whole sentences)
- For formulas write plainly: a² + b² = c² (do NOT use LaTeX or $ symbols)
- Keep answers under 200 words unless user asks for detailed notes
- End with one-line takeaway when explaining a concept`;

  const userContent = context?.questionText
    ? `Question: ${context.questionText}\n\nStudent asks: ${message}`
    : message;

  const response = await client.chat.completions.create({
    model: env.OPENROUTER_MENTOR_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 350,
  });

  return response.choices[0]?.message?.content ?? 'I could not generate a response. Please try again.';
}
