/** MentorsDaily ExamPrep Pro — Government exam taxonomy */

export interface ExamDefinition {
  name: string;
  slug: string;
}

export interface ExamGroupDefinition {
  name: string;
  slug: string;
  icon: string;
  exams: ExamDefinition[];
}

export const EXAM_ECOSYSTEM: ExamGroupDefinition[] = [
  {
    name: 'SSC',
    slug: 'ssc',
    icon: 'Building2',
    exams: [
      { name: 'SSC CGL', slug: 'ssc-cgl' },
      { name: 'SSC CHSL', slug: 'ssc-chsl' },
      { name: 'SSC MTS', slug: 'ssc-mts' },
      { name: 'SSC GD', slug: 'ssc-gd' },
      { name: 'SSC CPO', slug: 'ssc-cpo' },
      { name: 'SSC Stenographer', slug: 'ssc-stenographer' },
    ],
  },
  {
    name: 'Banking',
    slug: 'banking',
    icon: 'Landmark',
    exams: [
      { name: 'SBI PO', slug: 'sbi-po' },
      { name: 'SBI Clerk', slug: 'sbi-clerk' },
      { name: 'IBPS PO', slug: 'ibps-po' },
      { name: 'IBPS Clerk', slug: 'ibps-clerk' },
      { name: 'RBI Assistant', slug: 'rbi-assistant' },
      { name: 'RBI Grade B', slug: 'rbi-grade-b' },
    ],
  },
  {
    name: 'Railway',
    slug: 'railway',
    icon: 'Train',
    exams: [
      { name: 'RRB NTPC', slug: 'rrb-ntpc' },
      { name: 'RRB Group D', slug: 'rrb-group-d' },
      { name: 'RRB JE', slug: 'rrb-je' },
    ],
  },
  {
    name: 'Police',
    slug: 'police',
    icon: 'Shield',
    exams: [
      { name: 'UP Police', slug: 'up-police' },
      { name: 'Delhi Police', slug: 'delhi-police' },
      { name: 'Bihar Police', slug: 'bihar-police' },
      { name: 'MP Police', slug: 'mp-police' },
      { name: 'Rajasthan Police', slug: 'rajasthan-police' },
    ],
  },
  {
    name: 'Defence',
    slug: 'defence',
    icon: 'Medal',
    exams: [
      { name: 'NDA', slug: 'nda' },
      { name: 'CDS', slug: 'cds' },
      { name: 'AFCAT', slug: 'afcat' },
      { name: 'Agniveer', slug: 'agniveer' },
    ],
  },
  {
    name: 'Teaching',
    slug: 'teaching',
    icon: 'GraduationCap',
    exams: [
      { name: 'CTET', slug: 'ctet' },
      { name: 'UPTET', slug: 'uptet' },
      { name: 'DSSSB', slug: 'dsssb' },
      { name: 'KVS', slug: 'kvs' },
      { name: 'NVS', slug: 'nvs' },
    ],
  },
  {
    name: 'UPSC',
    slug: 'upsc',
    icon: 'ScrollText',
    exams: [
      { name: 'UPSC Prelims', slug: 'upsc-prelims' },
      { name: 'UPSC Mains', slug: 'upsc-mains' },
      { name: 'UPSC Optional', slug: 'upsc-optional' },
    ],
  },
  {
    name: 'State PCS',
    slug: 'state-pcs',
    icon: 'MapPin',
    exams: [
      { name: 'UPPCS', slug: 'uppcs' },
      { name: 'BPSC', slug: 'bpsc' },
      { name: 'MPPSC', slug: 'mppsc' },
      { name: 'RPSC', slug: 'rpsc' },
      { name: 'UKPSC', slug: 'ukpsc' },
    ],
  },
];

export function flattenExams(): Array<ExamDefinition & { categorySlug: string; categoryName: string }> {
  return EXAM_ECOSYSTEM.flatMap((g) =>
    g.exams.map((e) => ({ ...e, categorySlug: g.slug, categoryName: g.name }))
  );
}
