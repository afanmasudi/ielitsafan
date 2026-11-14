import { getSetting, setSetting } from './db';

/** Remembers which questions a learner has been asked, so new sessions avoid repeats. */
export const normQ = (q: string) => q.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

export type History = Record<string, number>; // normalised question → last asked (ms)

export const loadHistory = (profileId: string) => getSetting<History>(`asked:${profileId}`, {});

export async function remember(profileId: string, questions: string[]) {
  const h = await loadHistory(profileId);
  const now = Date.now();
  for (const q of questions) h[normQ(q)] = now;
  // Keep the newest 600 entries.
  const trimmed = Object.fromEntries(Object.entries(h).sort((a, b) => b[1] - a[1]).slice(0, 600));
  await setSetting(`asked:${profileId}`, trimmed);
}

/** Orders candidates: never-asked first (shuffled), then least-recently asked. */
export function freshFirst<T>(items: T[], key: (t: T) => string, history: History, rnd: () => number): T[] {
  const tagged = items.map((it) => ({ it, at: history[normQ(key(it))] ?? 0, r: rnd() }));
  return tagged.sort((a, b) => (a.at === 0 && b.at === 0 ? a.r - b.r : a.at - b.at)).map((x) => x.it);
}
