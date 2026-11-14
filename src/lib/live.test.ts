import { describe, expect, it } from 'vitest';
import { VadCore } from './vad';
import { decideTurn, POLICIES } from './turnTaking';
import { classifyIntent, clarifiedWord, cosine, relevanceLabel } from './intent';
import { freshFirst, normQ } from './questionHistory';
import { errorPatterns, linreg, masteryByType, projectBand, weakestFirst } from './insights';
import { FaceSession, type FaceFrame } from './faceMetrics';
import { buildSpeakingExam } from '../content/speaking';
import type { Attempt, Mistake } from './db';

describe('voice activity detection', () => {
  const run = (pattern: [number, number][]) => {
    const v = new VadCore();
    const events: string[] = [];
    for (const [rms, ms] of pattern) for (let t = 0; t < ms; t += 30) { const e = v.push(rms, 30); if (e) events.push(e); }
    return { v, events };
  };
  it('detects speech start and end against a noise floor', () => {
    const { events } = run([[0.003, 1000], [0.08, 1500], [0.003, 1000]]);
    expect(events).toEqual(['start', 'end']);
  });
  it('ignores short clicks', () => {
    expect(run([[0.003, 600], [0.2, 60], [0.003, 600]]).events).toEqual([]);
  });
  it('adapts to a noisy room', () => {
    const { events } = run([[0.02, 3000], [0.025, 500], [0.15, 1000], [0.02, 1000]]);
    expect(events).toEqual(['start', 'end']);
  });
  it('raises the threshold while the examiner talks (barge-in protection)', () => {
    const v = new VadCore();
    for (let t = 0; t < 900; t += 30) v.push(0.004, 30);
    let ev = null;
    for (let t = 0; t < 600; t += 30) ev = v.push(0.03, 30, 3) ?? ev;
    expect(ev).toBeNull(); // examiner bleed at modest level is ignored
    for (let t = 0; t < 600; t += 30) ev = v.push(0.2, 30, 3) ?? ev;
    expect(ev).toBe('start'); // a real barge-in is detected
  });
});

describe('turn-taking policy', () => {
  const p = POLICIES.part1;
  const base = { sinceAsked: 0, speaking: false, speechMs: 0, silenceMs: 0, nudged: false };
  it('waits, then nudges, then gives up when the candidate is silent', () => {
    expect(decideTurn({ ...base, sinceAsked: 3000 }, p)).toBe('wait');
    expect(decideTurn({ ...base, sinceAsked: 7500 }, p)).toBe('nudge');
    expect(decideTurn({ ...base, sinceAsked: 9000, nudged: true }, p)).toBe('wait');
    expect(decideTurn({ ...base, sinceAsked: 23000, nudged: true }, p)).toBe('give-up');
  });
  it('ends the turn after a pause following speech', () => {
    expect(decideTurn({ ...base, speechMs: 5000, silenceMs: 800 }, p)).toBe('wait');
    expect(decideTurn({ ...base, speechMs: 5000, silenceMs: 1600 }, p)).toBe('end-turn');
  });
  it('gives extra time after a thinking filler', () => {
    expect(decideTurn({ ...base, speechMs: 1200, silenceMs: 2000, thinking: true }, p)).toBe('wait');
  });
  it('interrupts very long answers', () => {
    expect(decideTurn({ ...base, speaking: true, speechMs: 46_000 }, p)).toBe('interrupt');
    expect(decideTurn({ ...base, speaking: true, speechMs: 60_000 }, POLICIES.part2)).toBe('wait');
  });
  it('allows long thinking pauses in the Part 2 monologue', () => {
    expect(decideTurn({ ...base, speechMs: 50_000, silenceMs: 4000 }, POLICIES.part2)).toBe('wait');
  });
});

describe('intent classification', () => {
  it.each([
    ['Sorry, could you repeat the question?', 'repeat'],
    ['Pardon?', 'repeat'],
    ["Sorry, I didn't catch that", 'repeat'],
    ['What does "sustainable" mean?', 'clarify'],
    ["I don't understand the question", 'clarify'],
    ['What about you?', 'ask-examiner'],
    ['And what do you think?', 'ask-examiner'],
    ['Hmm, let me think.', 'thinking'],
    ["That's a difficult question", 'thinking'],
    ['', 'silence'],
    ['I live in a flat in the city centre with two friends, and I really like it because it is close to work.', 'answer'],
    ['What I enjoy most is meeting new people, because it helps me learn about different cultures.', 'answer'],
    ['Do you know, I have never thought about it, but I think public transport is better.', 'answer'],
  ])('%s → %s', (t, want) => expect(classifyIntent(t)).toBe(want));
  it('extracts the word being clarified', () => expect(clarifiedWord('What does "commute" mean?')).toBe('commute'));
  it('cosine and relevance labels', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(relevanceLabel(0.5)).toBe('on-topic');
    expect(relevanceLabel(0.1)).toBe('off-topic');
  });
});

describe('non-repeating questions', () => {
  it('puts unseen questions first', () => {
    const items = ['Q a?', 'Q b?', 'Q c?'];
    const h = { [normQ('Q a?')]: 100, [normQ('Q b?')]: 50 };
    expect(freshFirst(items, (x) => x, h, Math.random)).toEqual(['Q c?', 'Q b?', 'Q a?']);
  });
  it('a new exam avoids questions asked in the previous one', () => {
    const first = buildSpeakingExam(1);
    const asked = Object.fromEntries(first.filter((s) => s.kind === 'question').map((s) => [normQ(s.text), 1]));
    const second = buildSpeakingExam(2, { history: asked });
    const firstCard = first.find((s) => s.kind === 'cue')!.text;
    expect(second.find((s) => s.kind === 'cue')!.text).not.toBe(firstCard);
    const repeats = second.filter((s) => s.kind === 'question' && asked[normQ(s.text)] && !/full name|work or are you a student/i.test(s.text));
    expect(repeats.length).toBe(0);
  });
});

describe('learner insights', () => {
  const now = Date.UTC(2026, 10, 14);
  const att = (days: number, byType: Record<string, [number, number]>, band = 6): Attempt => ({ profileId: 'p', kind: 'reading', refId: 'x', title: 'x', at: now - days * 86_400_000, durationSec: 1, band, data: { byType: Object.fromEntries(Object.entries(byType).map(([k, [c, t]]) => [k, { correct: c, total: t }])) } });
  it('estimates mastery per question type and orders weakest first', () => {
    const m = masteryByType([att(10, { tfng: [2, 7], mcq: [6, 6] }), att(2, { tfng: [3, 7], mcq: [5, 6] })], now);
    expect(m[0].type).toBe('tfng');
    expect(m[0].mean).toBeLessThan(m[1].mean);
    expect(m[0].low).toBeLessThan(m[0].mean);
  });
  it('linear regression and projection', () => {
    expect(linreg([0, 1, 2], [1, 3, 5]).slope).toBeCloseTo(2);
    const atts = [att(28, {}, 5), att(21, {}, 5.5), att(14, {}, 5.5), att(7, {}, 6), att(0, {}, 6.5)];
    const p = projectBand(atts, 'reading', now + 28 * 86_400_000)!;
    expect(p.projected).toBeGreaterThan(6.5);
    expect(p.projected).toBeLessThanOrEqual(9);
    expect(p.low).toBeLessThan(p.projected);
    expect(projectBand(atts.slice(0, 2), 'reading', now)).toBeNull();
  });
  it('detects rising and falling error patterns', () => {
    const m = (days: number, type: string): Mistake => ({ profileId: 'p', skill: 'writing', type, example: '', at: now - days * 86_400_000 });
    const pats = errorPatterns([m(1, 'article'), m(2, 'article'), m(3, 'article'), m(20, 'article'), m(20, 'agreement'), m(21, 'agreement'), m(22, 'agreement')], now);
    expect(pats.find((p) => p.type === 'article')!.direction).toBe('rising');
    expect(pats.find((p) => p.type === 'agreement')!.direction).toBe('falling');
  });
  it('recommends the practice item with the weakest types', () => {
    const m = masteryByType([att(1, { tfng: [1, 7], headings: [6, 6] })], now);
    expect(weakestFirst([{ id: 'h', types: ['headings'] }, { id: 't', types: ['tfng'] }], m)[0].id).toBe('t');
  });
});

describe('webcam session summary', () => {
  it('measures presence, eye contact and look-away episodes', () => {
    const s = new FaceSession();
    for (let i = 0; i < 300; i++) {
      const t = i * 100;
      const away = i >= 100 && i < 130; // 3 s looking away while speaking
      const f: FaceFrame = { t, present: i < 280, jawOpen: i % 2 ? 0.3 : 0.05, smile: 0.1, gazeAway: away ? 0.8 : 0.1, yaw: away ? 30 : 0, pitch: 0, audioSpeaking: i >= 50 };
      s.add(f);
    }
    const sum = s.summary();
    expect(sum.presencePct).toBe(93);
    expect(sum.lookAwayEpisodes).toBe(1);
    expect(sum.eyeContactPct).toBeGreaterThan(80);
    expect(sum.notes.length).toBeGreaterThan(0);
  });
});

describe('end-of-turn completeness', async () => {
  const { isCompleteUtterance } = await import('./intent');
  it.each([
    ['I live in a flat near the station.', true],
    ['I really enjoy it because', false],
    ['My favourite subject was maths and', false],
    ['Hmm, let me think.', false],
    ['Yes.', true],
    ['Sorry, could you repeat that?', true],
    ['I think it is important,', false],
  ])('%s → %s', (t, want) => expect(isCompleteUtterance(t)).toBe(want));
});

describe('skipping a covered question', () => {
  it('moves past a question without recording a turn', async () => {
    const { examReducer, initExam, current } = await import('./speakingMachine');
    let s = examReducer(initExam(buildSpeakingExam(3)), { type: 'start' });
    s = examReducer(s, { type: 'advance' });
    const q = current(s)!;
    s = examReducer(s, { type: 'skip' });
    expect(current(s)!.id).not.toBe(q.id);
    expect(s.turns.length).toBe(0);
  });
});
