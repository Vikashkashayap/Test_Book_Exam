/** Exam-specific system prompts for AI MCQ generation */

export interface ExamPromptConfig {
  examName: string;
  subjects: string[];
  systemPrompt: string;
}

const JSON_RULES = `
Return ONLY valid JSON — no markdown, no extra text.
Output format: {"questions":[{"question":"...","questionHi":"...","options":["A text","B text","C text","D text"],"optionsHi":["A hi","B hi","C hi","D hi"],"correctAnswer":"A","explanation":"...","explanationHi":"..."}]}
Exactly 4 options per question. One correct answer (A, B, C, or D).
Include questionHi and optionsHi (Hindi in Devanagari) for every question in the same response.
Escape double quotes inside strings. Keep explanations under 80 words.
Avoid repeating question wording from previous batches.`;

function buildPrompt(examName: string, subjects: string[], style: string): string {
  return `Generate high-quality ${examName} level MCQs.

Subjects:
${subjects.map((s) => `- ${s}`).join('\n')}

${style}

Difficulty should match the requested level.

${JSON_RULES}`;
}

export const SSC_CGL_PROMPT = buildPrompt('SSC CGL', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'General Awareness',
], 'Follow latest SSC CGL pattern. Use exam-like phrasing for Tier-1 style questions.');

export const SSC_CHSL_PROMPT = buildPrompt('SSC CHSL', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'General Awareness',
], 'Follow SSC CHSL pattern. Moderate difficulty suitable for 10+2 level.');

export const SSC_MTS_PROMPT = buildPrompt('SSC MTS', [
  'Reasoning',
  'Numerical Aptitude',
  'English',
  'General Awareness',
], 'Follow SSC MTS pattern. Straightforward stems appropriate for multi-tasking staff exam.');

export const SSC_GD_PROMPT = buildPrompt('SSC GD', [
  'General Intelligence & Reasoning',
  'General Knowledge',
  'Elementary Mathematics',
  'English/Hindi',
], 'Follow SSC GD Constable pattern. Focus on basic aptitude and GK.');

export const SSC_CPO_PROMPT = buildPrompt('SSC CPO', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'General Awareness',
], 'Follow SSC CPO (Sub-Inspector) pattern. Slightly higher difficulty than CHSL.');

export const SBI_PO_PROMPT = buildPrompt('SBI PO', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'Banking Awareness',
], 'Generate Banking exam level questions for SBI PO Prelims/Mains style.');

export const SBI_CLERK_PROMPT = buildPrompt('SBI Clerk', [
  'Reasoning',
  'Numerical Ability',
  'English',
  'General/Financial Awareness',
], 'SBI Clerk pattern: clerical aptitude, data interpretation, and banking basics.');

export const IBPS_PO_PROMPT = buildPrompt('IBPS PO', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'Banking Awareness',
], 'Generate Banking exam level questions. IBPS PO Prelims style.');

export const IBPS_CLERK_PROMPT = buildPrompt('IBPS Clerk', [
  'Reasoning',
  'Numerical Ability',
  'English',
  'General Awareness',
], 'IBPS Clerk pattern with clerical reasoning and basic quant.');

export const RBI_GRADE_B_PROMPT = buildPrompt('RBI Grade B', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'General Awareness',
  'Economics & Finance',
], 'RBI Grade B level: include economics, finance, and regulatory awareness.');

export const RRB_NTPC_PROMPT = buildPrompt('RRB NTPC', [
  'General Awareness',
  'Mathematics',
  'General Intelligence & Reasoning',
], 'Railway RRB NTPC pattern: GK, arithmetic, and reasoning.');

export const RRB_GROUP_D_PROMPT = buildPrompt('RRB Group D', [
  'Mathematics',
  'General Intelligence & Reasoning',
  'General Science',
  'General Awareness',
], 'RRB Group D pattern: basic level questions for track maintainer, helper posts.');

export const RRB_JE_PROMPT = buildPrompt('RRB JE', [
  'General Awareness',
  'General Intelligence & Reasoning',
  'Arithmetic',
  'Technical (Engineering basics)',
], 'RRB Junior Engineer pattern: technical aptitude with engineering fundamentals.');

export const UP_POLICE_PROMPT = buildPrompt('UP Police', [
  'GK',
  'Hindi',
  'Reasoning',
  'Current Affairs',
], 'Generate UP Police Constable/SI level MCQs. Include Hindi grammar and UP-specific GK where relevant.');

export const DELHI_POLICE_PROMPT = buildPrompt('Delhi Police', [
  'GK',
  'Reasoning',
  'Numerical Ability',
  'Current Affairs',
], 'Delhi Police exam pattern with national and Delhi-specific awareness.');

export const BIHAR_POLICE_PROMPT = buildPrompt('Bihar Police', [
  'GK',
  'Hindi',
  'Reasoning',
  'Current Affairs',
], 'Bihar Police exam pattern with state GK and Hindi comprehension.');

export const MP_POLICE_PROMPT = buildPrompt('MP Police', [
  'GK',
  'Hindi',
  'Reasoning',
  'Current Affairs',
], 'MP Police exam pattern with Madhya Pradesh specific GK.');

export const UPSC_PRELIMS_PROMPT = buildPrompt('UPSC Prelims', [
  'Polity',
  'History',
  'Geography',
  'Economy',
  'Environment',
  'Science',
], 'Use statement-based UPSC Prelims style questions. Two-statement or assertion-reason format where appropriate.');

export const UPSC_MAINS_PROMPT = buildPrompt('UPSC Mains', [
  'Polity & Governance',
  'History',
  'Geography',
  'Economy',
  'Ethics',
  'Current Affairs',
], 'UPSC Mains GS style conceptual MCQs. Analytical and multi-dimensional questions.');

export const UPPCS_PROMPT = buildPrompt('UPPCS', [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'UP GK',
  'Current Affairs',
], 'UPPCS Prelims pattern with Uttar Pradesh specific GK.');

export const BPSC_PROMPT = buildPrompt('BPSC', [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Bihar GK',
  'Current Affairs',
], 'BPSC pattern with Bihar state-specific questions.');

export const MPPSC_PROMPT = buildPrompt('MPPSC', [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'MP GK',
  'Current Affairs',
], 'MPPSC pattern with Madhya Pradesh specific GK.');

export const RPSC_PROMPT = buildPrompt('RPSC', [
  'History',
  'Geography',
  'Polity',
  'Economy',
  'Rajasthan GK',
  'Current Affairs',
], 'RPSC RAS pattern with Rajasthan specific GK.');

export const NDA_PROMPT = buildPrompt('NDA', [
  'Mathematics',
  'General Ability (English)',
  'General Ability (GK)',
  'Physics & Chemistry basics',
], 'NDA pattern: Class 12 level maths and GAT with defence-oriented GK.');

export const CDS_PROMPT = buildPrompt('CDS', [
  'English',
  'General Knowledge',
  'Elementary Mathematics',
], 'CDS OTA/IMA pattern with graduate-level GK and maths.');

export const AFCAT_PROMPT = buildPrompt('AFCAT', [
  'Verbal Ability',
  'Numerical Ability',
  'Reasoning',
  'General Awareness',
  'Military Aptitude',
], 'AFCAT pattern with verbal, numerical, reasoning, and military aptitude.');

export const CTET_PROMPT = buildPrompt('CTET', [
  'Child Development & Pedagogy',
  'Language I',
  'Language II',
  'Mathematics',
  'Environmental Studies',
], 'CTET Paper I/II pattern with pedagogy and teaching methodology questions.');

export const UPTET_PROMPT = buildPrompt('UPTET', [
  'Child Development & Pedagogy',
  'Hindi',
  'English/Sanskrit',
  'Mathematics',
  'Environmental Studies',
], 'UPTET pattern aligned with UP teaching eligibility syllabus.');

export const DSSSB_PROMPT = buildPrompt('DSSSB', [
  'General Awareness',
  'General Intelligence & Reasoning',
  'Arithmetic',
  'English/Hindi',
  'Subject-specific (Teaching)',
], 'DSSSB TGT/PGT pattern with teaching aptitude and subject knowledge.');

/** Map exam slug → default subjects */
export const EXAM_SUBJECTS: Record<string, string[]> = {
  'ssc-cgl': ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'],
  'ssc-chsl': ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'],
  'ssc-mts': ['Reasoning', 'Numerical Aptitude', 'English', 'General Awareness'],
  'ssc-gd': ['General Intelligence & Reasoning', 'General Knowledge', 'Elementary Mathematics', 'English/Hindi'],
  'ssc-cpo': ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'],
  'sbi-po': ['Reasoning', 'Quantitative Aptitude', 'English', 'Banking Awareness'],
  'sbi-clerk': ['Reasoning', 'Numerical Ability', 'English', 'General/Financial Awareness'],
  'ibps-po': ['Reasoning', 'Quantitative Aptitude', 'English', 'Banking Awareness'],
  'ibps-clerk': ['Reasoning', 'Numerical Ability', 'English', 'General Awareness'],
  'rbi-grade-b': ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness', 'Economics & Finance'],
  'rrb-ntpc': ['General Awareness', 'Mathematics', 'General Intelligence & Reasoning'],
  'rrb-group-d': ['Mathematics', 'General Intelligence & Reasoning', 'General Science', 'General Awareness'],
  'rrb-je': ['General Awareness', 'General Intelligence & Reasoning', 'Arithmetic', 'Technical (Engineering basics)'],
  'up-police': ['GK', 'Hindi', 'Reasoning', 'Current Affairs'],
  'delhi-police': ['GK', 'Reasoning', 'Numerical Ability', 'Current Affairs'],
  'bihar-police': ['GK', 'Hindi', 'Reasoning', 'Current Affairs'],
  'mp-police': ['GK', 'Hindi', 'Reasoning', 'Current Affairs'],
  'upsc-prelims': ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science'],
  'upsc-mains': ['Polity & Governance', 'History', 'Geography', 'Economy', 'Ethics', 'Current Affairs'],
  'uppcs': ['History', 'Geography', 'Polity', 'Economy', 'UP GK', 'Current Affairs'],
  'bpsc': ['History', 'Geography', 'Polity', 'Economy', 'Bihar GK', 'Current Affairs'],
  'mppsc': ['History', 'Geography', 'Polity', 'Economy', 'MP GK', 'Current Affairs'],
  'rpsc': ['History', 'Geography', 'Polity', 'Economy', 'Rajasthan GK', 'Current Affairs'],
  'nda': ['Mathematics', 'General Ability (English)', 'General Ability (GK)', 'Physics & Chemistry basics'],
  'cds': ['English', 'General Knowledge', 'Elementary Mathematics'],
  'afcat': ['Verbal Ability', 'Numerical Ability', 'Reasoning', 'General Awareness', 'Military Aptitude'],
  'ctet': ['Child Development & Pedagogy', 'Language I', 'Language II', 'Mathematics', 'Environmental Studies'],
  'uptet': ['Child Development & Pedagogy', 'Hindi', 'English/Sanskrit', 'Mathematics', 'Environmental Studies'],
  'dsssb': ['General Awareness', 'General Intelligence & Reasoning', 'Arithmetic', 'English/Hindi', 'Subject-specific (Teaching)'],
};

const CATEGORY_SUBJECTS: Record<string, string[]> = {
  ssc: ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'],
  banking: ['Reasoning', 'Quantitative Aptitude', 'English', 'Banking Awareness'],
  railway: ['General Awareness', 'Mathematics', 'General Intelligence & Reasoning'],
  police: ['GK', 'Hindi', 'Reasoning', 'Current Affairs'],
  upsc: ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science'],
  'state-pcs': ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs'],
  defence: ['Mathematics', 'English', 'General Knowledge', 'Reasoning'],
  teaching: ['Child Development & Pedagogy', 'Language', 'Mathematics', 'Environmental Studies'],
};

export function getExamSubjects(examSlug: string, categorySlug?: string): string[] {
  if (EXAM_SUBJECTS[examSlug]) return EXAM_SUBJECTS[examSlug];
  if (categorySlug && CATEGORY_SUBJECTS[categorySlug]) return CATEGORY_SUBJECTS[categorySlug];
  return ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'];
}

/** Map exam slug → system prompt */
export const EXAM_PROMPTS: Record<string, string> = {
  'ssc-cgl': SSC_CGL_PROMPT,
  'ssc-chsl': SSC_CHSL_PROMPT,
  'ssc-mts': SSC_MTS_PROMPT,
  'ssc-gd': SSC_GD_PROMPT,
  'ssc-cpo': SSC_CPO_PROMPT,
  'sbi-po': SBI_PO_PROMPT,
  'sbi-clerk': SBI_CLERK_PROMPT,
  'ibps-po': IBPS_PO_PROMPT,
  'ibps-clerk': IBPS_CLERK_PROMPT,
  'rbi-grade-b': RBI_GRADE_B_PROMPT,
  'rrb-ntpc': RRB_NTPC_PROMPT,
  'rrb-group-d': RRB_GROUP_D_PROMPT,
  'rrb-je': RRB_JE_PROMPT,
  'up-police': UP_POLICE_PROMPT,
  'delhi-police': DELHI_POLICE_PROMPT,
  'bihar-police': BIHAR_POLICE_PROMPT,
  'mp-police': MP_POLICE_PROMPT,
  'upsc-prelims': UPSC_PRELIMS_PROMPT,
  'upsc-mains': UPSC_MAINS_PROMPT,
  'uppcs': UPPCS_PROMPT,
  'bpsc': BPSC_PROMPT,
  'mppsc': MPPSC_PROMPT,
  'rpsc': RPSC_PROMPT,
  'nda': NDA_PROMPT,
  'cds': CDS_PROMPT,
  'afcat': AFCAT_PROMPT,
  'ctet': CTET_PROMPT,
  'uptet': UPTET_PROMPT,
  'dsssb': DSSSB_PROMPT,
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  ssc: SSC_CGL_PROMPT,
  banking: IBPS_PO_PROMPT,
  railway: RRB_NTPC_PROMPT,
  police: UP_POLICE_PROMPT,
  upsc: UPSC_PRELIMS_PROMPT,
  'state-pcs': UPPCS_PROMPT,
  defence: NDA_PROMPT,
  teaching: CTET_PROMPT,
};

const GENERIC_PROMPT = buildPrompt('Indian Competitive Exam', [
  'Reasoning',
  'Quantitative Aptitude',
  'English',
  'General Awareness',
], 'Generate realistic competitive exam MCQs.');

export function getExamSystemPrompt(examSlug: string, categorySlug?: string): string {
  if (EXAM_PROMPTS[examSlug]) return EXAM_PROMPTS[examSlug];
  if (categorySlug && CATEGORY_FALLBACKS[categorySlug]) return CATEGORY_FALLBACKS[categorySlug];
  return GENERIC_PROMPT;
}

export function buildGenerationUserPrompt(params: {
  count: number;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  excludeHashes?: string[];
}): string {
  const diffNote =
    params.difficulty === 'mixed'
      ? 'Mix easy, medium, and hard questions evenly.'
      : `All questions should be ${params.difficulty} difficulty.`;

  let prompt = `Generate exactly ${params.count} MCQs.

Subject:
${params.subject}

Difficulty:
${params.difficulty}
${diffNote}

Return JSON only.`;

  if (params.excludeHashes?.length) {
    prompt += `\n\nDo NOT repeat or closely paraphrase questions that match these content fingerprints (generate entirely new questions):\n${params.excludeHashes.slice(0, 20).join(', ')}`;
  }

  return prompt;
}
