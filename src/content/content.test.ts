import { describe, expect, it } from 'vitest';
import { PASSAGES, readingTest } from './reading';
import { LISTENING, transcriptOf } from './listening';
import { isCorrect, isOptionGroup, markGroups, normAnswer } from '../lib/marking';
import type { QGroup } from './types';
import { GRAMMAR, PLACEMENT } from './grammar';
import { WRITING_PROMPTS } from './writing';
import { CUE_CARDS, PART1_TOPICS } from './speaking';
import { searchKb } from './knowledge';

const norm = (s: string) => s.replace(/[’']/g, "'").replace(/\s+/g, ' ').toLowerCase();

/** Every answer key must be supported by the source text before it can appear in a test. */
function validate(groups: QGroup[], source: string, label: string) {
  const src = norm(source);
  for (const g of groups) {
    for (const it of g.items) {
      expect(src.includes(norm(it.evidence)), `${label} Q${it.n}: evidence not found: "${it.evidence}"`).toBe(true);
      expect(it.answer.length, `${label} Q${it.n} has no answer`).toBeGreaterThan(0);
      if (isOptionGroup(g)) {
        const keys = it.options ? it.options.map((_, i) => 'ABCD'[i]) : g.type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : g.type === 'ynng' ? ['YES', 'NO', 'NOT GIVEN'] : g.type === 'map' ? g.map!.labels.map((l) => l.key) : g.options!.map((o) => o.key);
        expect(keys, `${label} Q${it.n} answer not among options`).toContain(it.answer[0]);
      } else {
        // The primary answer must occur in the evidence (numbers may be formatted differently).
        const ev = normAnswer(it.evidence), a = normAnswer(it.answer[0]);
        const ok = ev.includes(a) || ev.replace(/\s/g, '').includes(a.replace(/\s/g, ''));
        expect(ok, `${label} Q${it.n}: answer "${a}" not in evidence "${ev}"`).toBe(true);
        expect(isCorrect(it, g, it.answer[0]), `${label} Q${it.n}: key fails its own marking`).toBe(true);
        if (g.maxWords) expect(normAnswer(it.answer[0]).split(' ').filter((w) => !/^\d/.test(w)).length).toBeLessThanOrEqual(g.maxWords);
      }
    }
  }
}

describe('reading tests', () => {
  for (const test of ['academic', 'general'] as const) {
    it(`${test}: 40 questions numbered 1–40`, () => {
      const nums = readingTest(test).flatMap((p) => p.groups.flatMap((g) => g.items.map((i) => i.n)));
      expect(nums).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    });
  }
  for (const p of PASSAGES) it(`${p.id}: answer keys validated against the passage`, () => validate(p.groups, p.paragraphs.map((x) => x.text).join(' '), p.id));
  it('heading questions refer to existing paragraphs', () => {
    for (const p of PASSAGES) for (const g of p.groups.filter((x) => x.type === 'headings'))
      for (const it of g.items) expect(p.paragraphs.some((x) => `Paragraph ${x.label}` === it.text)).toBe(true);
  });
  it('covers every required Reading question type', () => {
    const types = new Set(PASSAGES.flatMap((p) => p.groups.map((g) => g.type)));
    for (const t of ['mcq', 'tfng', 'ynng', 'headings', 'matching-info', 'matching-features', 'endings', 'summary', 'notes', 'table', 'sentence', 'short']) expect(types).toContain(t);
  });
});

describe('listening test', () => {
  it('has four parts and 40 questions', () => {
    expect(LISTENING.map((p) => p.part)).toEqual([1, 2, 3, 4]);
    expect(LISTENING.flatMap((p) => p.groups.flatMap((g) => g.items.map((i) => i.n)))).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  });
  for (const p of LISTENING) it(`${p.id}: audio script, questions and key match`, () => validate(p.groups, transcriptOf(p), p.id));
  it('covers the required Listening question types', () => {
    const types = new Set(LISTENING.flatMap((p) => p.groups.map((g) => g.type)));
    for (const t of ['mcq', 'matching-features', 'map', 'form', 'notes', 'table', 'flow', 'sentence', 'short']) expect(types).toContain(t);
  });
  it('uses more than one English variety', () => {
    const voices = new Set(LISTENING.flatMap((p) => p.lines.map((l) => l.voice)));
    expect([...voices].some((v) => v.startsWith('us'))).toBe(true);
    expect([...voices].some((v) => v.startsWith('uk') || v.startsWith('examiner'))).toBe(true);
  });
});

describe('marking', () => {
  const g: QGroup = { type: 'sentence', maxWords: 2, instructions: '', items: [{ n: 1, text: '', answer: ['practical clothing'], evidence: '' }] };
  it('is case- and article-insensitive but enforces word limits', () => {
    expect(isCorrect(g.items[0], g, 'Practical Clothing')).toBe(true);
    expect(isCorrect(g.items[0], g, 'the practical clothing')).toBe(true);
    expect(isCorrect(g.items[0], g, 'very practical clothing')).toBe(false);
    expect(markGroups([g], { 1: 'practical clothing' }).correct).toBe(1);
  });
});

describe('other content', () => {
  it('grammar quiz answers are valid indices', () => {
    for (const l of GRAMMAR) for (const q of l.quiz) expect(q.options[q.answer]).toBeDefined();
    for (const q of PLACEMENT) expect(q.options[q.answer]).toBeDefined();
  });
  it('writing covers all Academic Task 1 visuals, letter tones and Task 2 types', () => {
    const charts = new Set(WRITING_PROMPTS.map((p) => p.chart?.type).filter(Boolean));
    for (const c of ['line', 'bar', 'pie', 'table', 'map', 'process', 'mixed']) expect(charts).toContain(c);
    expect(new Set(WRITING_PROMPTS.map((p) => p.tone).filter(Boolean))).toEqual(new Set(['formal', 'semi-formal', 'informal']));
    expect(new Set(WRITING_PROMPTS.map((p) => p.essayType).filter(Boolean)).size).toBe(5);
  });
  it('speaking bank has enough distinct material', () => {
    expect(Object.keys(PART1_TOPICS).length).toBeGreaterThanOrEqual(10);
    expect(CUE_CARDS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(CUE_CARDS.flatMap((c) => c.part3)).size).toBe(CUE_CARDS.flatMap((c) => c.part3).length);
  });
  it('knowledge base retrieval finds relevant entries', () => {
    expect(searchKb('how is the overall band rounded')[0].id).toBe('scoring');
    expect(searchKb('true false not given')[0].id).toBe('tfng');
  });
});

describe('Band 8.5 strategy guide', async () => {
  const { GUIDES, cardForType, tipOfTheDay } = await import('./strategy');
  it('every card is complete and concise', () => {
    for (const g of GUIDES) {
      expect(g.band85.length).toBeGreaterThan(0);
      for (const c of g.cards) {
        expect(c.steps.length, c.id).toBeGreaterThanOrEqual(3);
        expect(c.steps.length, c.id).toBeLessThanOrEqual(5);
        expect(c.dos.length && c.donts.length, c.id).toBeTruthy();
        expect(c.trick.length, c.id).toBeLessThan(200);
        expect(c.example.task && c.example.thinking && c.example.answer, c.id).toBeTruthy();
      }
    }
    expect(new Set(GUIDES.flatMap((g) => g.cards.map((c) => c.id))).size).toBe(GUIDES.flatMap((g) => g.cards).length);
  });
  it('every question type used in the tests has a strategy card', () => {
    for (const p of PASSAGES) for (const g of p.groups) expect(cardForType(g.type, 'reading'), g.type).toBeDefined();
    for (const p of LISTENING) for (const g of p.groups) expect(cardForType(g.type, 'listening'), g.type).toBeDefined();
  });
  it('tip of the day rotates', () => {
    expect(tipOfTheDay(new Date('2026-01-01')).trick).not.toBe(tipOfTheDay(new Date('2026-01-02')).trick);
  });
});
