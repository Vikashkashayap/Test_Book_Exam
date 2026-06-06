/**
 * Legacy module — wraps centralized OpenRouter AI service.
 * Kept for backward compatibility with ai-generator routes.
 */
import fs from 'fs';
import OpenAI from 'openai';
import { env } from '../config/env';
import {
  generateMCQs as openRouterGenerateMCQs,
  isOpenRouterConfigured,
  getDefaultModel,
  DEFAULT_OPENROUTER_MODEL,
} from '../lib/ai/openrouter';

export interface GeneratedMCQ {
  question: string;
  questionHi?: string;
  options: { id: string; text: string; textHi?: string }[];
  correctAnswer: string;
  explanation: string;
  explanationHi?: string;
}

let openRouterClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!env.OPENROUTER_API_KEY) return null;
  if (!openRouterClient) {
    openRouterClient = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': env.FRONTEND_URL,
        'X-Title': 'MentorsDaily ExamPrep Pro',
      },
    });
  }
  return openRouterClient;
}

export async function generateMCQs(params: {
  count: number;
  examName: string;
  categoryName: string;
  subjectName: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  aiModel?: string;
  examSlug?: string;
  categorySlug?: string;
}): Promise<GeneratedMCQ[]> {
  const examSlug =
    params.examSlug ??
    params.examName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const categorySlug =
    params.categorySlug ??
    params.categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  const result = await openRouterGenerateMCQs({
    count: params.count,
    examSlug,
    categorySlug,
    subject: params.subjectName,
    difficulty: params.difficulty,
    model: params.aiModel,
  });

  return result.questions;
}

export async function extractMCQsFromPdf(params: {
  filePath: string;
  examName: string;
  categoryName: string;
  subjectName?: string;
  topicName?: string;
  maxQuestions?: number;
  aiModel?: string;
}): Promise<GeneratedMCQ[]> {
  const client = getClient();
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');

  const pdfBuffer = fs.readFileSync(params.filePath);
  const base64 = pdfBuffer.toString('base64');
  const maxQuestions = params.maxQuestions ?? 30;
  const model = params.aiModel ?? DEFAULT_OPENROUTER_MODEL;

  const prompt = `Extract up to ${maxQuestions} MCQs from this PDF for ${params.examName} (${params.categoryName}).
${params.subjectName ? `Subject: ${params.subjectName}` : ''}
${params.topicName ? `Topic: ${params.topicName}` : ''}

Return valid JSON: {"questions":[{"question":"...","questionHi":"...","options":["A text","B text","C text","D text"],"optionsHi":["A hi","B hi","C hi","D hi"],"correctAnswer":"A","explanation":"...","explanationHi":"..."}]}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Return ONLY valid JSON. No markdown.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'file',
            file: {
              filename: 'questions.pdf',
              file_data: `data:application/pdf;base64,${base64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: Math.min(5000, (maxQuestions ?? 30) * 400 + 200),
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI model');

  const parsed = JSON.parse(text) as { questions?: Record<string, unknown>[] };
  const raw = parsed.questions ?? [];
  const optionIds = ['A', 'B', 'C', 'D'];

  return raw.map((q, i) => {
    let options: { id: string; text: string; textHi?: string }[] = [];
    const optionsHi = Array.isArray(q.optionsHi) ? (q.optionsHi as unknown[]).map(String) : [];
    if (Array.isArray(q.options)) {
      options = (q.options as unknown[]).map((opt, idx) => {
        if (typeof opt === 'string') {
          return { id: optionIds[idx], text: opt, textHi: optionsHi[idx] };
        }
        const o = opt as Record<string, string>;
        return {
          id: o.id ?? optionIds[idx],
          text: o.text ?? o.label ?? '',
          textHi: o.textHi ?? optionsHi[idx],
        };
      });
    }
    const correct = String(q.correctAnswer ?? 'A').trim().toUpperCase().charAt(0) || 'A';
    return {
      question: String(q.question ?? `Question ${i + 1}`),
      questionHi: q.questionHi ? String(q.questionHi) : undefined,
      options: options.slice(0, 4),
      correctAnswer: optionIds.includes(correct) ? correct : 'A',
      explanation: String(q.explanation ?? ''),
      explanationHi: q.explanationHi ? String(q.explanationHi) : undefined,
    };
  });
}

export function isGeminiConfigured(): boolean {
  return isOpenRouterConfigured();
}

export function getAiModelName(): string {
  return getDefaultModel();
}
