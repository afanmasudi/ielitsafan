/** SM-2 style spaced repetition (Wozniak 1990), with grades 0–3 for a simpler UI. */
export type Grade = 0 | 1 | 2 | 3; // again, hard, good, easy

export interface SrsState { ease: number; interval: number; reps: number; due: number; lapses: number }

const DAY = 86_400_000;

export const newSrs = (now = Date.now()): SrsState => ({ ease: 2.5, interval: 0, reps: 0, due: now, lapses: 0 });

export function review(s: SrsState, g: Grade, now = Date.now()): SrsState {
  if (g === 0) return { ease: Math.max(1.3, s.ease - 0.2), interval: 0, reps: 0, due: now + 10 * 60_000, lapses: s.lapses + 1 };
  const q = [0, 3, 4, 5][g];
  const ease = Math.max(1.3, s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const reps = s.reps + 1;
  let interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(s.interval * ease);
  if (g === 1) interval = Math.max(1, Math.round(interval * 0.6));
  if (g === 3) interval = Math.round(interval * 1.3) + 1;
  return { ease, interval, reps, due: now + interval * DAY, lapses: s.lapses };
}

export const isLearned = (s: Pick<SrsState, 'interval'>) => s.interval >= 21;
