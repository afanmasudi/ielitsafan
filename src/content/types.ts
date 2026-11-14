export type QType =
  | 'mcq' | 'tfng' | 'ynng' | 'headings' | 'matching-info' | 'matching-features' | 'endings'
  | 'summary' | 'notes' | 'table' | 'sentence' | 'short' | 'form' | 'flow' | 'map';

export interface QItem {
  n: number;
  text: string;
  /** Accepted answers. For option questions, the option key (e.g. "B", "iv", "TRUE"). */
  answer: string[];
  /** Verbatim text from the passage or transcript that supports the answer. */
  evidence: string;
  options?: string[]; // per-item multiple choice options (A, B, C…)
}

export interface QGroup {
  type: QType;
  instructions: string;
  options?: { key: string; text: string }[];
  maxWords?: number;
  table?: { head: string[]; rows: string[][] }; // cells may contain {n} gap markers
  map?: { image: 'campus' | 'museum'; labels: { key: string; x: number; y: number }[] };
  items: QItem[];
}

export interface Passage {
  id: string;
  test: 'academic' | 'general';
  title: string;
  section: number;
  paragraphs: { label?: string; text: string }[];
  groups: QGroup[];
  minutes: number;
  /** Short practice set, not part of the full 40-question test. */
  practiceOnly?: boolean;
}
