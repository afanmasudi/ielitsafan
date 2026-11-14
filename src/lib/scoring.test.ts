import { describe, expect, it } from 'vitest';
import {
  roundOverall, overallBand, writingBand, criteriaBand, rawToBand, floorHalf,
  LISTENING_TABLE, ACADEMIC_READING_TABLE, GENERAL_READING_TABLE, bandToCefr, lifeSkillsResult, bandRange,
} from './scoring';

describe('overall band rounding (official rule)', () => {
  it.each([
    [6.0, 6], [6.125, 6], [6.25, 6.5], [6.375, 6.5], [6.5, 6.5], [6.625, 6.5], [6.75, 7], [6.875, 7], [8.75, 9], [0.25, 0.5],
  ])('mean %s → %s', (mean, band) => expect(roundOverall(mean)).toBe(band));

  it('matches the IELTS.org worked examples', () => {
    expect(overallBand({ listening: 6.5, reading: 6.5, writing: 5, speaking: 7 })).toBe(6.5); // 6.25 → 6.5
    expect(overallBand({ listening: 4, reading: 3.5, writing: 4, speaking: 4 })).toBe(4); // 3.875 → 4
    expect(overallBand({ listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6 })).toBe(6); // 6.125 → 6
  });
});

describe('writing weighting', () => {
  it('Task 2 counts double', () => {
    expect(writingBand(5, 7)).toBe(6); // 19/3 = 6.33 → 6
    expect(writingBand(7, 5)).toBe(5.5); // 17/3 = 5.67 → 5.5
    expect(writingBand(6, 6)).toBe(6);
  });
  it('Task 2 has more influence than Task 1', () => {
    expect(writingBand(5, 7)).toBeGreaterThan(writingBand(7, 5));
  });
});

describe('criterion averages', () => {
  it('rounds down to half bands (documented cautious assumption)', () => {
    expect(criteriaBand([6, 6, 7, 7])).toBe(6.5);
    expect(criteriaBand([6, 6, 6, 7])).toBe(6); // 6.25 → 6
    expect(criteriaBand([7, 7, 7, 6.5])).toBe(6.5); // 6.875 → 6.5
    expect(floorHalf(5.999)).toBe(5.5);
  });
});

describe('raw score conversion', () => {
  it('listening', () => {
    expect(rawToBand(40, LISTENING_TABLE)).toBe(9);
    expect(rawToBand(30, LISTENING_TABLE)).toBe(7);
    expect(rawToBand(23, LISTENING_TABLE)).toBe(6);
    expect(rawToBand(16, LISTENING_TABLE)).toBe(5);
  });
  it('academic and general reading differ', () => {
    expect(rawToBand(30, ACADEMIC_READING_TABLE)).toBe(7);
    expect(rawToBand(30, GENERAL_READING_TABLE)).toBe(6);
    expect(rawToBand(34, GENERAL_READING_TABLE)).toBe(7);
    expect(rawToBand(23, GENERAL_READING_TABLE)).toBe(5);
  });
  it('tables are monotonic and complete', () => {
    for (const t of [LISTENING_TABLE, ACADEMIC_READING_TABLE, GENERAL_READING_TABLE]) {
      let prev = -1;
      for (let raw = 0; raw <= 40; raw++) {
        const b = rawToBand(raw, t);
        expect(b).toBeGreaterThanOrEqual(prev);
        prev = b;
      }
      expect(t.source).toBeTruthy();
    }
  });
  it('scales shorter practice sets', () => {
    expect(rawToBand(10, LISTENING_TABLE, 10)).toBe(9);
    expect(rawToBand(5, LISTENING_TABLE, 10)).toBe(5.5); // 20/40
  });
  it('rejects invalid input', () => expect(() => rawToBand(-1, LISTENING_TABLE)).toThrow());
});

describe('helpers', () => {
  it('CEFR', () => { expect(bandToCefr(7)).toBe('C1'); expect(bandToCefr(5.5)).toBe('B2'); expect(bandToCefr(4.5)).toBe('B1'); });
  it('life skills pass/fail', () => { expect(lifeSkillsResult({ a: 0.7, b: 0.65 })).toBe('Pass'); expect(lifeSkillsResult({ a: 0.9, b: 0.4 })).toBe('Fail'); });
  it('band range clamps', () => expect(bandRange(8.5, 1)).toEqual([7.5, 9]));
});
