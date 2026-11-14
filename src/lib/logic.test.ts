import { describe, expect, it } from 'vitest';
import { examReducer, initExam, current, MAX_FOLLOWUPS_PER_PART } from './speakingMachine';
import { buildSpeakingExam } from '../content/speaking';
import { review, newSrs } from './srs';
import { generatePlan } from './plan';
import { validateBackup, BACKUP_FORMAT } from './backup';
import { placementLevel, PLACEMENT } from '../content/grammar';

describe('speaking exam state machine', () => {
  const steps = buildSpeakingExam(42);
  const run = () => {
    let s = examReducer(initExam(steps), { type: 'start' });
    const seen: string[] = [];
    let guard = 0;
    while (s.status === 'running' && guard++ < 200) {
      const st = current(s)!;
      seen.push(`${st.part}:${st.kind}:${st.text}`);
      s = st.kind === 'question' || st.kind === 'talk' ? examReducer(s, { type: 'answer', text: 'answer ' + guard }) : examReducer(s, { type: 'advance' });
    }
    return { s, seen };
  };
  it('runs all three parts in order without repeats', () => {
    const { s, seen } = run();
    expect(s.status).toBe('finished');
    const parts = seen.map((x) => Number(x[0])).filter((p) => p > 0);
    expect([...parts].sort()).toEqual(parts); // non-decreasing
    expect(new Set(parts)).toEqual(new Set([1, 2, 3]));
    expect(new Set(seen).size).toBe(seen.length);
    expect(s.turns.some((t) => t.part === 2)).toBe(true);
  });
  it('includes the Part 2 preparation and talk steps with official timings', () => {
    expect(steps.find((x) => x.kind === 'prep')!.seconds).toBe(60);
    expect(steps.find((x) => x.kind === 'talk')!.seconds).toBe(120);
  });
  it('cannot skip a question with "advance"', () => {
    let s = examReducer(initExam(steps), { type: 'start' });
    s = examReducer(s, { type: 'advance' }); // intro
    const q = current(s)!;
    expect(q.kind).toBe('question');
    expect(examReducer(s, { type: 'advance' })).toBe(s);
  });
  it('limits follow-ups and rejects duplicates', () => {
    let s = examReducer(initExam(steps), { type: 'start' });
    s = examReducer(s, { type: 'advance' });
    s = examReducer(s, { type: 'answer', text: 'My name is Sam' });
    for (let i = 0; i < 5; i++) s = examReducer(s, { type: 'followUp', text: `Follow up ${i}?` });
    expect(s.steps.filter((x) => x.followUp).length).toBeLessThanOrEqual(MAX_FOLLOWUPS_PER_PART);
    const before = s.steps.length;
    s = examReducer(s, { type: 'followUp', text: steps[1].text });
    expect(s.steps.length).toBe(before);
  });
});

describe('spaced repetition', () => {
  it('grows intervals for good answers and resets on failure', () => {
    let s = newSrs(0);
    s = review(s, 2, 0); expect(s.interval).toBe(1);
    s = review(s, 2, 0); expect(s.interval).toBe(3);
    s = review(s, 2, 0); expect(s.interval).toBeGreaterThan(6);
    const failed = review(s, 0, 0);
    expect(failed.interval).toBe(0);
    expect(failed.lapses).toBe(1);
    expect(failed.ease).toBeLessThan(s.ease);
  });
});

describe('study plan', () => {
  const base = { testType: 'academic' as const, currentLevel: 'B1', target: 6.5, dailyMinutes: 60, weakSkills: ['writing' as const], strongSkills: ['listening' as const] };
  it('covers the weeks until the exam and stops at the exam date', () => {
    const now = new Date('2026-01-01T09:00:00');
    const p = generatePlan({ ...base, examDate: '2026-01-29' }, now);
    expect(p.daysToExam).toBe(28);
    expect(p.weeks.length).toBe(4);
    expect(p.weeks.flatMap((w) => w.days).at(-1)!.date <= '2026-01-29').toBe(true);
  });
  it('gives weak skills more practice than strong skills', () => {
    const p = generatePlan(base, new Date('2026-01-01'));
    const tasks = p.weeks.flatMap((w) => w.days.flatMap((d) => d.tasks));
    const count = (s: string) => tasks.filter((t) => t.skill === s).length;
    expect(count('writing')).toBeGreaterThan(count('listening'));
    expect(count('mock')).toBeGreaterThan(0);
  });
  it('Life Skills plans only include speaking and listening', () => {
    const p = generatePlan({ ...base, testType: 'lifeskills', weakSkills: [], strongSkills: [] }, new Date('2026-01-01'));
    const skills = new Set(p.weeks.flatMap((w) => w.days.flatMap((d) => d.tasks.map((t) => t.skill))));
    expect(skills.has('writing')).toBe(false);
    expect(skills.has('reading')).toBe(false);
  });
});

describe('backup validation', () => {
  it('accepts valid and rejects foreign files', () => {
    expect(validateBackup({ format: BACKUP_FORMAT, version: 1, exportedAt: '', profiles: [{ id: 'a', name: 'A' }], tables: {} })).toBe(true);
    expect(validateBackup({ format: 'other', version: 1, profiles: [], tables: {} })).toBe(false);
    expect(validateBackup({ format: BACKUP_FORMAT, version: 99, profiles: [], tables: {} })).toBe(false);
    expect(validateBackup(null)).toBe(false);
  });
});

describe('placement', () => {
  it('maps scores to CEFR levels', () => {
    expect(placementLevel(PLACEMENT.map(() => true))).toBe('C1');
    expect(placementLevel(PLACEMENT.map(() => false))).toBe('A1');
    expect(placementLevel(PLACEMENT.map((q) => q.level === 'A2' || q.level === 'B1'))).toBe('B1');
  });
});
