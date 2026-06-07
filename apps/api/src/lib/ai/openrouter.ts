import OpenAI from 'openai';
import { MASTER_SYSTEM_PROMPT, buildQuestionUserPrompt, buildPyqQuestionUserPrompt } from './systemPrompt';
import { getExamProfile, formatDifficultyLabel } from './examProfiles';
import { computeQuestionHash } from './questionHash';
import { env } from '../../config/env';

export { computeQuestionHash };

export const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL;

/** Smaller batches — bilingual output is ~2× tokens per question */
const BATCH_SIZE_LARGE = 8;
const BATCH_SIZE_MEDIUM = 6;
const BATCH_SIZE_DEFAULT = 5;
const MAX_TOPUP_ROUNDS = 2;
const MAX_TOTAL_ROUNDS = 5;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;
/** ~400 output tokens per bilingual MCQ; cap prevents runaway generation */
const TOKENS_PER_QUESTION = 400;
const TOKEN_OVERHEAD = 200;
const MAX_OUTPUT_TOKENS = 5000;

/** Approximate cost per 1M tokens for gemini-2.5-flash-lite via OpenRouter */
const COST_PER_1M_INPUT = 0.075;
const COST_PER_1M_OUTPUT = 0.3;

export interface RawMCQ {
  question: string;
  questionHi?: string;
  options: string[];
  optionsHi?: string[];
  correctAnswer: string;
  explanation: string;
  explanationHi?: string;
}

export interface NormalizedMCQ {
  question: string;
  questionHi?: string;
  options: { id: string; text: string; textHi?: string }[];
  correctAnswer: string;
  explanation: string;
  explanationHi?: string;
  questionHash: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface GenerationResult {
  questions: NormalizedMCQ[];
  usage: TokenUsage;
  model: string;
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

export function isOpenRouterConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY);
}

export function getDefaultModel(): string {
  return DEFAULT_OPENROUTER_MODEL;
}

export function estimateCost(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1_000_000) * COST_PER_1M_INPUT +
    (completionTokens / 1_000_000) * COST_PER_1M_OUTPUT
  );
}

function extractQuestionsArray(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    for (const key of ['questions', 'data', 'mcqs', 'items', 'result']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  throw new Error('Expected JSON array of questions');
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
    .replace(/```[\s\S]*$/i, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function repairJsonText(raw: string): string {
  return raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\t/g, ' ')
    .trim();
}

/** Extract first balanced JSON object or array from text */
function extractBalancedJson(text: string): string | null {
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  let start = -1;

  if (startObj >= 0 && (startArr < 0 || startObj <= startArr)) start = startObj;
  else if (startArr >= 0) start = startArr;
  if (start < 0) return null;

  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === open) depth++;
    if (c === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function isValidQuestionObj(obj: Record<string, unknown>): boolean {
  return (
    Boolean(obj.question) &&
    Array.isArray(obj.options) &&
    (obj.options as unknown[]).length >= 2 &&
    Boolean(obj.correctAnswer)
  );
}

/** Extract only fully-formed question objects (handles truncated AI responses) */
function salvageCompleteQuestions(raw: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const re = /\{\s*"question"\s*:/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) starts.push(m.index);

  for (let i = 0; i < starts.length; i++) {
    const chunk = raw.slice(starts[i], starts[i + 1] ?? raw.length);
    const balanced = extractBalancedJson(chunk);
    if (!balanced) continue;
    try {
      const obj = JSON.parse(repairJsonText(balanced)) as Record<string, unknown>;
      if (!isValidQuestionObj(obj)) continue;
      const key = String(obj.question).slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(obj);
    } catch {
      // incomplete object — skip
    }
  }

  if (results.length) return results;

  // Regex fallback for well-formed objects
  const objectPattern =
    /\{[^{}]*"question"\s*:\s*"[\s\S]*?"[^{}]*"options"\s*:\s*\[[\s\S]*?\][^{}]*"correctAnswer"\s*:\s*"[ABCD]"[^{}]*"explanation"\s*:\s*"[\s\S]*?"[^{}]*\}/gi;
  for (const chunk of raw.match(objectPattern) ?? []) {
    try {
      const obj = JSON.parse(repairJsonText(chunk)) as Record<string, unknown>;
      if (isValidQuestionObj(obj)) results.push(obj);
    } catch {
      // skip
    }
  }

  return results;
}

function parseJsonArray<T>(raw: string): T[] {
  const cleaned = repairJsonText(stripCodeFences(raw));

  const candidates = [
    cleaned,
    extractBalancedJson(cleaned) ?? '',
    cleaned.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*\][\s\S]*\}/)?.[0] ?? '',
  ].filter(Boolean);

  for (const attempt of candidates) {
    try {
      return extractQuestionsArray(JSON.parse(attempt)) as T[];
    } catch {
      // try next
    }
  }

  // Extract questions array substring
  const questionsMatch = cleaned.match(/"questions"\s*:\s*(\[[\s\S]*)/);
  if (questionsMatch) {
    let arr = questionsMatch[1];
    const lastBrace = arr.lastIndexOf('}');
    if (lastBrace > 0) {
      arr = `${arr.slice(0, lastBrace + 1)}]`;
      try {
        return JSON.parse(repairJsonText(arr)) as T[];
      } catch {
        // continue
      }
    }
  }

  const salvaged = salvageCompleteQuestions(cleaned);
  if (salvaged.length) return salvaged as T[];

  if (process.env.NODE_ENV === 'development') {
    console.warn('[openrouter] Failed to parse AI JSON, sample:', cleaned.slice(0, 500));
  }

  throw new Error('Could not parse AI response as valid JSON');
}

function normalizeMcq(q: Record<string, unknown>, index: number): NormalizedMCQ {
  const optionIds = ['A', 'B', 'C', 'D'];
  let options: { id: string; text: string }[] = [];

  if (Array.isArray(q.options)) {
    options = (q.options as unknown[]).map((opt, i) => {
      if (typeof opt === 'string') return { id: optionIds[i] ?? String(i + 1), text: opt };
      const o = opt as Record<string, string>;
      return { id: o.id ?? optionIds[i] ?? String(i + 1), text: o.text ?? o.label ?? '' };
    });
  }

  if (options.length < 4) {
    options = optionIds.map((id, i) => ({
      id,
      text: (options[i]?.text as string) || `Option ${id}`,
    }));
  }

  const correct =
    String(q.correctAnswer ?? q.answer ?? 'A')
      .trim()
      .toUpperCase()
      .charAt(0) || 'A';

  const question = String(q.question ?? q.text ?? `Question ${index + 1}`);
  const questionHi = q.questionHi ? String(q.questionHi) : undefined;
  const optionsHi = Array.isArray(q.optionsHi) ? (q.optionsHi as unknown[]).map(String) : [];
  const trimmedOptions = options.slice(0, 4).map((opt, i) => ({
    ...opt,
    textHi: optionsHi[i] || undefined,
  }));

  return {
    question,
    questionHi,
    options: trimmedOptions,
    correctAnswer: optionIds.includes(correct) ? correct : 'A',
    explanation: String(q.explanation ?? q.solution ?? ''),
    explanationHi: q.explanationHi ? String(q.explanationHi) : undefined,
    questionHash: computeQuestionHash(question),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateMaxTokens(questionCount: number): number {
  return Math.min(
    MAX_OUTPUT_TOKENS,
    Math.max(1000, questionCount * TOKENS_PER_QUESTION + TOKEN_OVERHEAD)
  );
}

async function chatCompletionWithRetry(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature = 0.7,
  useJsonMode = true,
  maxTokens?: number
): Promise<{ text: string; usage: TokenUsage }> {
  const client = getClient();
  if (!client) throw new Error('OPENROUTER_API_KEY is not configured');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: attempt > 0 ? Math.min(temperature, 0.4) : temperature,
        max_tokens: maxTokens ?? MAX_OUTPUT_TOKENS,
        ...(useJsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response from AI model');

      const promptTokens = response.usage?.prompt_tokens ?? 0;
      const completionTokens = response.usage?.completion_tokens ?? 0;

      return {
        text,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostUsd: estimateCost(promptTokens, completionTokens),
        },
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('AI request failed');
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error('AI request failed after retries');
}

function buildSystemPrompt(examSlug: string, categorySlug: string): string {
  const profile = getExamProfile(examSlug, categorySlug);
  return `${MASTER_SYSTEM_PROMPT}\nExam: ${profile.name} | ${profile.pattern} | Subjects: ${profile.subjects.join(', ')}`;
}

function parseWithSalvage(text: string): Record<string, unknown>[] {
  try {
    return parseJsonArray<Record<string, unknown>>(text);
  } catch {
    const salvaged = salvageCompleteQuestions(stripCodeFences(text));
    if (salvaged.length) return salvaged;
    throw new Error('Could not parse AI response as valid JSON');
  }
}

function resolveBatchSize(totalCount: number, isTopup: boolean): number {
  if (isTopup) return Math.min(totalCount, 3);
  if (totalCount >= 80) return BATCH_SIZE_LARGE;
  if (totalCount >= 40) return BATCH_SIZE_MEDIUM;
  return Math.min(totalCount, BATCH_SIZE_DEFAULT);
}

async function generateBatch(params: {
  count: number;
  examSlug: string;
  categorySlug: string;
  subject: string;
  topic?: string;
  year?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  excludeHashes?: string[];
  excludeQuestions?: string[];
  model?: string;
}): Promise<GenerationResult> {
  const model = params.model ?? DEFAULT_OPENROUTER_MODEL;
  const profile = getExamProfile(params.examSlug, params.categorySlug);
  const systemPrompt = buildSystemPrompt(params.examSlug, params.categorySlug);
  const userPrompt = params.year
    ? buildPyqQuestionUserPrompt({
        examName: profile.name,
        pattern: profile.pattern,
        subject: params.subject,
        year: params.year,
        difficulty: formatDifficultyLabel(params.difficulty),
        count: params.count,
        excludeQuestions: params.excludeQuestions,
      })
    : buildQuestionUserPrompt({
        examName: profile.name,
        pattern: profile.pattern,
        subject: params.subject,
        topic: params.topic ?? 'General',
        difficulty: formatDifficultyLabel(params.difficulty),
        count: params.count,
        excludeQuestions: params.excludeQuestions,
      });

  const maxTokens = estimateMaxTokens(params.count);
  const result = await chatCompletionWithRetry(
    systemPrompt,
    userPrompt,
    model,
    0.4,
    true,
    maxTokens
  );
  const text = result.text;
  let usage = result.usage;

  let raw: Record<string, unknown>[] = [];
  try {
    raw = parseWithSalvage(text);
  } catch {
    raw = salvageCompleteQuestions(stripCodeFences(text));
  }

  // One small retry only when nothing was parseable
  if (!raw.length) {
    const onePrompt = params.year
      ? buildPyqQuestionUserPrompt({
          examName: profile.name,
          pattern: profile.pattern,
          subject: params.subject,
          year: params.year,
          difficulty: formatDifficultyLabel(params.difficulty),
          count: 1,
          excludeQuestions: params.excludeQuestions,
        })
      : buildQuestionUserPrompt({
          examName: profile.name,
          pattern: profile.pattern,
          subject: params.subject,
          topic: params.topic ?? 'General',
          difficulty: formatDifficultyLabel(params.difficulty),
          count: 1,
          excludeQuestions: params.excludeQuestions,
        });
    const retry = await chatCompletionWithRetry(
      systemPrompt,
      onePrompt,
      model,
      0.3,
      true,
      estimateMaxTokens(1)
    );
    usage = {
      promptTokens: usage.promptTokens + retry.usage.promptTokens,
      completionTokens: usage.completionTokens + retry.usage.completionTokens,
      totalTokens: usage.totalTokens + retry.usage.totalTokens,
      estimatedCostUsd: usage.estimatedCostUsd + retry.usage.estimatedCostUsd,
    };
    try {
      raw = parseWithSalvage(retry.text);
    } catch {
      raw = salvageCompleteQuestions(stripCodeFences(retry.text));
    }
  }

  const questions = raw.slice(0, params.count).map((q, i) => normalizeMcq(q, i));
  if (!questions.length) throw new Error('AI returned no parseable questions');

  return { questions, usage, model };
}

export interface GenerateMCQsParams {
  count: number;
  examSlug: string;
  categorySlug: string;
  subject: string;
  topic?: string;
  year?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  excludeHashes?: string[];
  model?: string;
  onProgress?: (generated: number, total: number) => void;
}

export async function generateMCQs(params: GenerateMCQsParams): Promise<GenerationResult> {
  const all: NormalizedMCQ[] = [];
  const seenHashes = new Set(params.excludeHashes ?? []);
  const recentQuestions: string[] = [];
  const totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
  };
  let model = params.model ?? DEFAULT_OPENROUTER_MODEL;

  const batchSize = resolveBatchSize(params.count, false);
  const plannedRounds = Math.ceil(params.count / batchSize);
  let round = 0;
  let topupRounds = 0;

  while (all.length < params.count && round < MAX_TOTAL_ROUNDS) {
    round++;
    const remaining = params.count - all.length;
    const isTopup = round > plannedRounds;
    const batchCount = Math.min(
      isTopup ? resolveBatchSize(remaining, true) : batchSize,
      remaining
    );

    const batch = await generateBatch({
      count: batchCount,
      examSlug: params.examSlug,
      categorySlug: params.categorySlug,
      subject: params.subject,
      topic: params.topic,
      year: params.year,
      difficulty: params.difficulty,
      excludeQuestions: recentQuestions,
      model: params.model,
    });

    model = batch.model;
    totalUsage.promptTokens += batch.usage.promptTokens;
    totalUsage.completionTokens += batch.usage.completionTokens;
    totalUsage.totalTokens += batch.usage.totalTokens;
    totalUsage.estimatedCostUsd += batch.usage.estimatedCostUsd;

    for (const q of batch.questions) {
      if (seenHashes.has(q.questionHash)) continue;
      seenHashes.add(q.questionHash);
      all.push(q);
      recentQuestions.push(q.question.slice(0, 80));
      if (recentQuestions.length > 12) recentQuestions.shift();
      if (all.length >= params.count) break;
    }

    params.onProgress?.(all.length, params.count);

    if (!batch.questions.length) {
      if (topupRounds < MAX_TOPUP_ROUNDS) {
        topupRounds++;
        continue;
      }
      break;
    }

    if (round >= plannedRounds && all.length < params.count) {
      topupRounds++;
      if (topupRounds > MAX_TOPUP_ROUNDS) break;
    }
  }

  if (!all.length) throw new Error('AI failed to generate any valid questions');

  return {
    questions: all.slice(0, params.count),
    usage: totalUsage,
    model,
  };
}
