import type { NegativeMarkingRule } from './types';

/** Resolve per-question negative marks from exam pattern rule */
export function resolveNegativeMarks(
  rule: NegativeMarkingRule,
  marksPerQuestion: number
): number {
  switch (rule.type) {
    case 'none':
      return 0;
    case 'fixed':
      return rule.value;
    case 'fraction':
      return (rule.numerator / rule.denominator) * marksPerQuestion;
    case 'as_per_pattern':
      // SSC MTS / NDA / CDS — use one-third of marks as standard govt pattern
      return marksPerQuestion / 3;
    default:
      return 0;
  }
}

export function isNegativeMarkingEnabled(rule: NegativeMarkingRule): boolean {
  if (rule.type === 'none') return false;
  if (rule.type === 'fixed') return rule.value > 0;
  if (rule.type === 'fraction') return rule.numerator > 0;
  return true;
}

export function formatNegativeMarkingLabel(
  rule: NegativeMarkingRule,
  marksPerQuestion = 1
): string {
  switch (rule.type) {
    case 'none':
      return 'No negative marking';
    case 'fixed':
      return `-${rule.value} per wrong answer`;
    case 'fraction':
      return `-${rule.numerator}/${rule.denominator} of marks per wrong answer`;
    case 'as_per_pattern':
      return `As per official pattern (−${(marksPerQuestion / 3).toFixed(2)} per wrong)`;
    default:
      return 'No negative marking';
  }
}

/** Evaluate a single answer with negative marking support */
export function evaluateAnswerMarks(params: {
  isCorrect: boolean;
  attempted: boolean;
  marksPerQuestion: number;
  negativeMarks: number;
  negativeMarkingEnabled: boolean;
}): number {
  if (!params.attempted) return 0;
  if (params.isCorrect) return params.marksPerQuestion;
  if (!params.negativeMarkingEnabled || params.negativeMarks <= 0) return 0;
  return -params.negativeMarks;
}

/** Round to 2 decimal places for display / storage */
export function roundMarks(value: number): number {
  return Math.round(value * 100) / 100;
}
