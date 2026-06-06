import crypto from 'crypto';

/** SHA256 hash from normalized question text for duplicate prevention */
export function computeQuestionHash(question: string): string {
  const normalized = question.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
