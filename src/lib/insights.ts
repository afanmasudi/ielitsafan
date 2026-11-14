/**
 * Learner modelling and pattern analysis over a learner's own history (all local).
 *  - Mastery per question type: Beta–Binomial posterior (prior Beta(2,2)) with recency weighting.
 *  - Trends: least-squares slope per week.
 *  - Band projection to the exam date with a residual-based range.
 *  - Error patterns: rising/falling mistake categories (last 14 days vs the 14 before).
 */
import type { Attempt, Mistake } from './db';

export interface Mastery { type: string; mean: number; low: number; high: number; n: number; trend: number }

export function linreg(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, sd: 0 };
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxx ? sxy / sxx : 0;
  const intercept = my - slope * mx;
  const sd = Math.sqrt(ys.reduce((s, y, i) => s + (y - (intercept + slope * xs[i])) ** 2, 0) / Math.max(1, n - 2));
  return { slope, intercept, sd };
}

/** Mastery of each Reading/Listening question type, newest attempts weighted more (half-life 30 days). */
export function masteryByType(attempts: Attempt[], now = Date.now()): Mastery[] {
  const acc: Record<string, { a: number; b: number; n: number; points: { t: number; v: number }[] }> = {};
  for (const at of attempts) {
    if (at.kind !== 'reading' && at.kind !== 'listening') continue;
    const byType = (at.data as { byType?: Record<string, { correct: number; total: number }> })?.byType;
    if (!byType) continue;
    const w = Math.pow(0.5, (now - at.at) / (30 * 86_400_000));
    for (const [type, v] of Object.entries(byType)) {
      const m = (acc[type] ??= { a: 2, b: 2, n: 0, points: [] });
      m.a += w * v.correct; m.b += w * (v.total - v.correct); m.n += v.total;
      m.points.push({ t: at.at, v: v.correct / v.total });
    }
  }
  return Object.entries(acc).map(([type, m]) => {
    const mean = m.a / (m.a + m.b);
    const sd = Math.sqrt((m.a * m.b) / ((m.a + m.b) ** 2 * (m.a + m.b + 1)));
    const pts = m.points.sort((x, y) => x.t - y.t);
    const trend = linreg(pts.map((p) => (p.t - pts[0].t) / 604_800_000), pts.map((p) => p.v)).slope;
    return { type, mean, low: Math.max(0, mean - 1.64 * sd), high: Math.min(1, mean + 1.64 * sd), n: m.n, trend };
  }).sort((a, b) => a.mean - b.mean);
}

export interface Projection { now: number; projected: number; low: number; high: number; perWeek: number; points: number }

/** Linear projection of a skill band to a target date. Needs at least 3 attempts. */
export function projectBand(attempts: Attempt[], kind: Attempt['kind'], targetDate: number): Projection | null {
  const pts = attempts.filter((a) => a.kind === kind && a.band !== undefined).sort((a, b) => a.at - b.at);
  if (pts.length < 3) return null;
  const t0 = pts[0].at;
  const xs = pts.map((p) => (p.at - t0) / 604_800_000), ys = pts.map((p) => p.band!);
  const { slope, intercept, sd } = linreg(xs, ys);
  const xT = (targetDate - t0) / 604_800_000;
  // Learning curves flatten: cap the weekly gain and the horizon effect.
  const perWeek = Math.max(-0.5, Math.min(0.5, slope));
  const current = intercept + slope * xs[xs.length - 1];
  const projected = Math.max(0, Math.min(9, current + perWeek * Math.min(12, Math.max(0, xT - xs[xs.length - 1]))));
  const spread = Math.max(0.5, 1.64 * sd);
  return { now: current, projected, low: Math.max(0, projected - spread), high: Math.min(9, projected + spread), perWeek, points: pts.length };
}

export interface SpeakingMetrics { wpm: number | null; fillersPer100: number; avgAnswerWords: number; pausesPerMin: number | null; band: number }

export function speakingSeries(attempts: Attempt[]) {
  return attempts
    .filter((a) => (a.kind === 'speaking' || a.kind === 'interview') && (a.data as { metrics?: SpeakingMetrics })?.metrics)
    .sort((a, b) => a.at - b.at)
    .map((a) => ({ at: a.at, ...(a.data as { metrics: SpeakingMetrics }).metrics }));
}

export interface ErrorPattern { key: string; skill: string; type: string; recent: number; before: number; direction: 'rising' | 'falling' | 'steady' | 'new' }

export function errorPatterns(mistakes: Mistake[], now = Date.now()): ErrorPattern[] {
  const D = 14 * 86_400_000;
  const map = new Map<string, ErrorPattern>();
  for (const m of mistakes) {
    const key = `${m.skill}|${m.type}`;
    const p = map.get(key) ?? { key, skill: m.skill, type: m.type, recent: 0, before: 0, direction: 'steady' as const };
    if (m.at > now - D) p.recent++; else if (m.at > now - 2 * D) p.before++;
    map.set(key, p);
  }
  return [...map.values()].filter((p) => p.recent + p.before > 0).map((p) => ({
    ...p,
    direction: p.before === 0 ? (p.recent ? 'new' : 'steady') : p.recent > p.before * 1.25 ? 'rising' : p.recent < p.before * 0.75 ? 'falling' : 'steady',
  } as ErrorPattern)).sort((a, b) => b.recent - a.recent);
}

/** Picks the practice item whose question types the learner is weakest at. */
export function weakestFirst<T extends { types: string[] }>(items: T[], mastery: Mastery[]): T[] {
  const m = new Map(mastery.map((x) => [x.type, x.mean]));
  const score = (it: T) => it.types.reduce((s, t) => s + (m.get(t) ?? 0.5), 0) / Math.max(1, it.types.length);
  return [...items].sort((a, b) => score(a) - score(b));
}
