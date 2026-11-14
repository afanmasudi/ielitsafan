/**
 * IELTS Studio scoring engine.
 *
 * Pure functions only. Nothing here calls an LLM, and the LLM never decides
 * these numbers. Every rule records where it came from.
 */

export const SCORING_RULES_VERSION = '2026.11-1';

export const SCORING_SOURCES = {
  overall: {
    rule: 'Overall band = mean of the four skill bands, rounded to the nearest half band; .25 rounds up to .5 and .75 rounds up to the next whole band.',
    source: 'IELTS.org, "How IELTS is scored" (ielts.org/take-a-test/your-results/ielts-scoring-in-detail)',
    checked: '2026-11-14',
  },
  writing: {
    rule: 'Four criteria per task, equally weighted. Task 2 contributes twice as much as Task 1 to the Writing band.',
    source: 'IELTS.org, "IELTS scoring in detail" and the public Writing band descriptors',
    checked: '2026-11-14',
  },
  speaking: {
    rule: 'Four criteria (Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation), equally weighted.',
    source: 'IELTS.org, Speaking band descriptors (public version)',
    checked: '2026-11-14',
  },
  rawScores: {
    rule: 'Listening and Reading: 40 questions, one mark each. Raw-to-band tables vary slightly between test versions; the tables below are the approximate published guide.',
    source: 'IELTS.org, "IELTS scoring in detail" (approximate conversion tables)',
    checked: '2026-11-14',
  },
  assumption: {
    rule: 'IELTS does not publish how examiners round criterion averages within a task. IELTS Studio rounds them DOWN to the nearest half band so estimates err on the cautious side.',
    source: 'IELTS Studio design decision (documented in RESEARCH.md)',
    checked: '2026-11-14',
  },
} as const;

/** Round down to the nearest 0.5. */
export const floorHalf = (n: number) => Math.floor(n * 2 + 1e-9) / 2;

/** Official overall-band rounding: x.25 → x.5, x.75 → x+1, otherwise nearest lower half. */
export function roundOverall(mean: number): number {
  const whole = Math.floor(mean + 1e-9);
  const frac = mean - whole;
  if (frac < 0.25 - 1e-9) return whole;
  if (frac < 0.75 - 1e-9) return whole + 0.5;
  return whole + 1;
}

export const clampBand = (n: number) => Math.min(9, Math.max(0, n));

export function overallBand(skills: { listening: number; reading: number; writing: number; speaking: number }) {
  const { listening, reading, writing, speaking } = skills;
  return roundOverall((listening + reading + writing + speaking) / 4);
}

export interface Criteria4 { a: number; b: number; c: number; d: number }

/** Task or speaking band from four equally-weighted criteria (cautious rounding, see SCORING_SOURCES.assumption). */
export const criteriaBand = (c: number[]) => floorHalf(c.reduce((s, x) => s + x, 0) / c.length);

/** Writing band: Task 2 weighted double. */
export const writingBand = (task1: number, task2: number) => floorHalf((task1 + 2 * task2) / 3);

type Row = [minRaw: number, band: number];
export interface ConversionTable { id: string; version: string; source: string; rows: Row[] }

export const LISTENING_TABLE: ConversionTable = {
  id: 'listening', version: SCORING_RULES_VERSION, source: SCORING_SOURCES.rawScores.source,
  rows: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]],
};

export const ACADEMIC_READING_TABLE: ConversionTable = {
  id: 'reading-academic', version: SCORING_RULES_VERSION, source: SCORING_SOURCES.rawScores.source,
  rows: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]],
};

export const GENERAL_READING_TABLE: ConversionTable = {
  id: 'reading-general', version: SCORING_RULES_VERSION, source: SCORING_SOURCES.rawScores.source,
  rows: [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1], [0, 0]],
};

export function rawToBand(raw: number, table: ConversionTable, total = 40): number {
  if (!Number.isFinite(raw) || raw < 0) throw new Error('raw score must be a non-negative number');
  // Shorter practice sets are scaled to the 40-question scale so the table still applies.
  const scaled = total === 40 ? raw : Math.round((raw / total) * 40);
  for (const [min, band] of table.rows) if (scaled >= min) return band;
  return 0;
}

export const readingTable = (type: 'academic' | 'general') => (type === 'academic' ? ACADEMIC_READING_TABLE : GENERAL_READING_TABLE);

/** Uncertainty shown next to estimates (± bands). Machine-estimated productive skills are wider. */
export const UNCERTAINTY = { listening: 0.5, reading: 0.5, writing: 1, speaking: 1, overall: 0.5 } as const;

export function bandRange(band: number, plusMinus: number): [number, number] {
  return [clampBand(band - plusMinus), clampBand(band + plusMinus)];
}

/** CEFR mapping published by IELTS (approximate). */
export function bandToCefr(band: number): string {
  if (band >= 8.5) return 'C2';
  if (band >= 7) return 'C1';
  if (band >= 5.5) return 'B2';
  if (band >= 4) return 'B1';
  if (band >= 3) return 'A2';
  return 'A1';
}

/** Life Skills uses Pass/Fail per level. Practice rule: every criterion at or above threshold (0–1 scale). */
export function lifeSkillsResult(criteria: Record<string, number>, threshold = 0.6): 'Pass' | 'Fail' {
  return Object.values(criteria).every((v) => v >= threshold) ? 'Pass' : 'Fail';
}
