/** Faculty-controlled PYQ and lab ingestion. No fabricated papers or experiments. */

export type PaperRecord = {
  id: string;
  academicYear: string;
  semester: string;
  examType: string;
  sourceRef: string;
  verified: boolean;
  uploadedAt: string;
  questions: Array<{
    id: string;
    text: string;
    unitHint?: string;
    topicId?: string;
    marks?: number;
    pageRef?: string;
    kind: "university_original" | "faculty_extracted" | "cforge_practice";
  }>;
};

export type LabRecord = {
  id: string;
  unitId: string;
  title: string;
  objective?: string;
  verified: boolean;
  sourceRef: string;
  uploadedAt: string;
};

const g = globalThis as typeof globalThis & {
  __cforgePapers?: PaperRecord[];
  __cforgeLabs?: LabRecord[];
};

export function listPapers() {
  return g.__cforgePapers ?? [];
}

export function listLabs() {
  return g.__cforgeLabs ?? [];
}

export function addPaper(paper: PaperRecord) {
  if (!g.__cforgePapers) g.__cforgePapers = [];
  g.__cforgePapers.push(paper);
}

export function addLab(lab: LabRecord) {
  if (!g.__cforgeLabs) g.__cforgeLabs = [];
  g.__cforgeLabs.push(lab);
}

export function resetIngest() {
  g.__cforgePapers = [];
  g.__cforgeLabs = [];
}

export function frequencyClaimsAllowed(papers: PaperRecord[]) {
  const verified = papers.filter((p) => p.verified && p.questions.length);
  return verified.length >= 3;
}
