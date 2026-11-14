import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, logStudy, type Profile } from './db';
import { deleteProfile, exportData, importData, hashPin, checkPin } from './backup';

const profile = (id: string): Profile => ({ id, name: `P-${id}`, avatar: 'grad-brand', createdAt: 1, onboarded: true, testType: 'academic', currentLevel: 'B2', target: 7, dailyMinutes: 30, strongSkills: [], weakSkills: [] });

beforeEach(async () => { await Promise.all(db.tables.map((t) => t.clear())); });

describe('local data flows', () => {
  it('stores attempts and study time per profile', async () => {
    await db.profiles.bulkAdd([profile('a'), profile('b')]);
    await db.attempts.add({ profileId: 'a', kind: 'reading', refId: 'x', title: 'x', at: 1, durationSec: 1, band: 6 });
    await logStudy('a', 30, 'task-1'); await logStudy('a', 30, 'task-1');
    const day = await db.days.where('profileId').equals('a').first();
    expect(day!.seconds).toBe(60);
    expect(day!.tasksDone).toEqual(['task-1']);
    expect(await db.attempts.where('profileId').equals('b').count()).toBe(0);
  });

  it('export → delete → import restores a profile exactly', async () => {
    await db.profiles.add(profile('a'));
    await db.attempts.add({ profileId: 'a', kind: 'writing', refId: 't2', title: 'Essay', at: 5, durationSec: 60, band: 6.5, data: { text: 'hello' } });
    await db.vocab.add({ profileId: 'a', word: 'mitigate', meaning: 'reduce', example: '', topic: 'Environment', ease: 2.5, interval: 0, reps: 0, due: 0, lapses: 0, addedAt: 1 });
    const backup = JSON.parse(JSON.stringify(await exportData('a')));
    await deleteProfile('a');
    expect(await db.profiles.count()).toBe(0);
    expect(await db.attempts.count()).toBe(0);
    expect(await importData(backup)).toBe(1);
    expect((await db.profiles.get('a'))!.name).toBe('P-a');
    const att = await db.attempts.toArray();
    expect(att).toHaveLength(1);
    expect(att[0].band).toBe(6.5);
    expect(await db.vocab.count()).toBe(1);
  });

  it('importing twice does not duplicate records', async () => {
    await db.profiles.add(profile('a'));
    await db.attempts.add({ profileId: 'a', kind: 'reading', refId: 'r', title: 'r', at: 1, durationSec: 1 });
    const backup = JSON.parse(JSON.stringify(await exportData()));
    await importData(backup); await importData(backup);
    expect(await db.attempts.count()).toBe(1);
  });

  it('deleting one profile leaves others untouched', async () => {
    await db.profiles.bulkAdd([profile('a'), profile('b')]);
    await db.attempts.bulkAdd([{ profileId: 'a', kind: 'reading', refId: 'r', title: 'r', at: 1, durationSec: 1 }, { profileId: 'b', kind: 'reading', refId: 'r', title: 'r', at: 1, durationSec: 1 }]);
    await deleteProfile('a');
    expect(await db.profiles.count()).toBe(1);
    expect((await db.attempts.toArray()).map((a) => a.profileId)).toEqual(['b']);
  });

  it('rejects files that are not backups', async () => {
    await expect(importData({ hello: 'world' })).rejects.toThrow(/not an IELTS Studio backup/);
  });

  it('PIN hashing verifies the right PIN only', async () => {
    const h = await hashPin('2468');
    const p = { ...profile('a'), pinHash: h.hash, pinSalt: h.salt };
    expect(await checkPin(p, '2468')).toBe(true);
    expect(await checkPin(p, '1357')).toBe(false);
    expect(h.hash).not.toContain('2468');
  });
});
