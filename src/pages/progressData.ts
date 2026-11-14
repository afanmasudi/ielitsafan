import type { Attempt, StudyDay } from '../lib/db';

export type SkillKey = 'listening' | 'reading' | 'writing' | 'speaking';

/** Most recent band per skill. */
export function latestBands(attempts: Attempt[]) {
  const out: Partial<Record<SkillKey, number>> = {};
  for (const a of [...attempts].sort((x, y) => y.at - x.at))
    if ((a.kind === 'listening' || a.kind === 'reading' || a.kind === 'writing' || a.kind === 'speaking') && a.band !== undefined && out[a.kind] === undefined) out[a.kind] = a.band;
  return out;
}

/** Consecutive days (ending today or yesterday) with at least one minute of study. */
export function streak(days: StudyDay[], now = new Date()) {
  const set = new Set(days.filter((d) => d.seconds >= 60 || d.tasksDone.length).map((d) => d.date));
  let n = 0;
  const d = new Date(now);
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function weekRecommendations(attempts: Attempt[], target: number) {
  const bands = latestBands(attempts);
  const recs: string[] = [];
  const order = (Object.entries(bands) as [SkillKey, number][]).sort((a, b) => a[1] - b[1]);
  if (!order.length) return ['Start with one practice task in each skill so we can see where to focus.'];
  const [weakest, wb] = order[0];
  if (wb < target) recs.push(`${weakest[0].toUpperCase() + weakest.slice(1)} is your lowest estimate (${wb.toFixed(1)}). Add two extra ${weakest} sessions this week.`);
  const missing = (['listening', 'reading', 'writing', 'speaking'] as SkillKey[]).filter((s) => bands[s] === undefined);
  if (missing.length) recs.push(`You haven't practised ${missing.join(' or ')} yet. Try one short set.`);
  const week = attempts.filter((a) => a.at > Date.now() - 7 * 86_400_000);
  if (week.length < 4) recs.push('Aim for at least four practice sessions this week; regular short sessions work better than cramming (Cepeda et al., 2006).');
  if (!attempts.some((a) => a.mockId && a.at > Date.now() - 14 * 86_400_000)) recs.push('Take a full or mini mock exam to check your timing.');
  return recs;
}
