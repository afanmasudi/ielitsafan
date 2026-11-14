import Dexie, { type Table } from 'dexie';

export type TestType = 'academic' | 'general' | 'ukvi-academic' | 'ukvi-general' | 'lifeskills';
export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';
export type LifeLevel = 'A1' | 'A2' | 'B1';

export interface Profile {
  id: string;
  name: string;
  avatar: string; // gradient key
  createdAt: number;
  pinHash?: string;
  pinSalt?: string;
  onboarded: boolean;
  testType: TestType;
  lifeLevel?: LifeLevel;
  currentLevel: string; // CEFR
  target: number; // band or 0 = Pass for life skills
  examDate?: string;
  dailyMinutes: number;
  strongSkills: Skill[];
  weakSkills: Skill[];
  placement?: { score: number; total: number; cefr: string; at: number };
}

export interface Attempt {
  id?: number;
  profileId: string;
  kind: 'reading' | 'listening' | 'writing' | 'speaking' | 'grammar' | 'placement' | 'interview' | 'lifeskills';
  refId: string;
  title: string;
  at: number;
  durationSec: number;
  band?: number;
  raw?: number;
  total?: number;
  data?: unknown; // answers, feedback, transcript
  mockId?: string;
}

export interface Draft { key: string; profileId: string; text: string; updatedAt: number }

export interface VocabCard {
  id?: number;
  profileId: string;
  word: string;
  meaning: string;
  example: string;
  topic: string;
  ease: number;
  interval: number; // days
  reps: number;
  due: number; // epoch ms
  lapses: number;
  addedAt: number;
}

export interface Note { id?: number; profileId: string; title: string; body: string; updatedAt: number }

export interface StudyDay { key: string; profileId: string; date: string; seconds: number; tasksDone: string[] }

export interface Mock {
  id: string;
  profileId: string;
  testType: TestType;
  startedAt: number;
  finishedAt?: number;
  sections: Partial<Record<Skill, { band: number; raw?: number; attemptId?: number }>>;
  overall?: number;
  lifeResult?: 'Pass' | 'Fail';
}

export interface CvRecord { profileId: string; fileName: string; savedAt: number; sections: Record<string, string[]> }

export interface Setting { key: string; value: unknown }

export interface Mistake { id?: number; profileId: string; skill: Skill | 'grammar'; type: string; example: string; at: number }

class StudioDB extends Dexie {
  profiles!: Table<Profile, string>;
  attempts!: Table<Attempt, number>;
  drafts!: Table<Draft, string>;
  vocab!: Table<VocabCard, number>;
  notes!: Table<Note, number>;
  days!: Table<StudyDay, string>;
  mocks!: Table<Mock, string>;
  cvs!: Table<CvRecord, string>;
  settings!: Table<Setting, string>;
  mistakes!: Table<Mistake, number>;

  constructor() {
    super('ielts-studio');
    this.version(1).stores({
      profiles: 'id, name',
      attempts: '++id, profileId, kind, at, [profileId+kind], mockId',
      drafts: 'key, profileId',
      vocab: '++id, profileId, due, [profileId+word]',
      notes: '++id, profileId, updatedAt',
      days: 'key, profileId, date',
      mocks: 'id, profileId, startedAt',
      cvs: 'profileId',
      settings: 'key',
      mistakes: '++id, profileId, type, at',
    });
  }
}

export const db = new StudioDB();

export const PROFILE_TABLES = ['attempts', 'drafts', 'vocab', 'notes', 'days', 'mocks', 'cvs', 'mistakes'] as const;

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export async function logStudy(profileId: string, seconds: number, task?: string) {
  const date = todayKey();
  const key = `${profileId}:${date}`;
  await db.transaction('rw', db.days, async () => {
    const row = (await db.days.get(key)) ?? { key, profileId, date, seconds: 0, tasksDone: [] };
    row.seconds += seconds;
    if (task && !row.tasksDone.includes(task)) row.tasksDone.push(task);
    await db.days.put(row);
  });
}

export async function recordMistakes(profileId: string, skill: Mistake['skill'], items: { type: string; example: string }[]) {
  if (!items.length) return;
  const at = Date.now();
  await db.mistakes.bulkAdd(items.slice(0, 20).map((m) => ({ profileId, skill, type: m.type, example: m.example.slice(0, 200), at })));
}
