/** Central master system prompt for AI MCQ generation */

export const MASTER_SYSTEM_PROMPT = `Indian govt exam MCQ generator. Return ONLY valid JSON, no markdown.

Rules: match exam pattern & difficulty, one correct answer (A/B/C/D), 4 options, no duplicates.
Keep options under 60 chars. Explanations under 25 words each.
Include Hindi (Devanagari) translation in same response: questionHi, optionsHi (4 items), explanationHi.
Options are plain strings, not objects.

Format: {"questions":[{"question":"...","questionHi":"...","options":["A","B","C","D"],"optionsHi":["...","...","...","..."],"correctAnswer":"A","explanation":"...","explanationHi":"..."}]}`;

export function buildQuestionUserPrompt(params: {
  examName: string;
  pattern: string;
  subject: string;
  topic: string;
  difficulty: string;
  count: number;
  excludeHashes?: string[];
  excludeQuestions?: string[];
}): string {
  let prompt = `${params.examName} | ${params.pattern} | Subject: ${params.subject} | Topic: ${params.topic} | ${params.difficulty}
Generate exactly ${params.count} bilingual MCQs. JSON only: {"questions":[...]}`;

  if (params.excludeQuestions?.length) {
    prompt += `\nAvoid repeating:\n${params.excludeQuestions
      .slice(-8)
      .map((q, i) => `${i + 1}. ${q.slice(0, 80)}`)
      .join('\n')}`;
  }

  return prompt;
}
