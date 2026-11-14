import type { QGroup, QItem } from '../content/types';

export const normAnswer = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/£/g, '').replace(/:/g, '.').replace(/[^a-z0-9.\- ]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/^(the|a|an) /, '').replace(/\.$/, '');

const OPTION_TYPES = new Set(['mcq', 'tfng', 'ynng', 'headings', 'matching-info', 'matching-features', 'endings', 'map']);
export const isOptionGroup = (g: QGroup) => OPTION_TYPES.has(g.type);

export function isCorrect(item: QItem, group: QGroup, response: string | undefined): boolean {
  if (!response) return false;
  if (isOptionGroup(group)) return item.answer.some((a) => a.toUpperCase() === response.trim().toUpperCase());
  const r = normAnswer(response);
  if (group.maxWords && r.split(' ').filter((w) => !/^\d/.test(w)).length > group.maxWords) return false;
  const rNoSpace = r.replace(/\s/g, '');
  return item.answer.some((a) => { const n = normAnswer(a); return n === r || (/^\d/.test(n) && n.replace(/\s/g, '') === rNoSpace); });
}

export interface MarkResult { correct: number; total: number; byItem: Record<number, boolean>; byType: Record<string, { correct: number; total: number }> }

export function markGroups(groups: QGroup[], answers: Record<number, string>): MarkResult {
  const res: MarkResult = { correct: 0, total: 0, byItem: {}, byType: {} };
  for (const g of groups)
    for (const it of g.items) {
      const ok = isCorrect(it, g, answers[it.n]);
      res.byItem[it.n] = ok;
      res.total++;
      if (ok) res.correct++;
      const t = (res.byType[g.type] ??= { correct: 0, total: 0 });
      t.total++;
      if (ok) t.correct++;
    }
  return res;
}

export const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple choice', tfng: 'True / False / Not Given', ynng: 'Yes / No / Not Given', headings: 'Matching headings',
  'matching-info': 'Matching information', 'matching-features': 'Matching features', endings: 'Sentence endings',
  summary: 'Summary completion', notes: 'Note completion', table: 'Table completion', sentence: 'Sentence completion',
  short: 'Short answer', form: 'Form completion', flow: 'Flow-chart completion', map: 'Map / plan labelling',
};
