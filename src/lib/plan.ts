import type { Profile, Skill } from './db';

export type Stage = 'Foundation' | 'Intermediate' | 'Advanced';
export interface PlanTask { id: string; title: string; minutes: number; route: string; skill: Skill | 'vocabulary' | 'grammar' | 'mock' | 'review' }
export interface PlanDay { date: string; weekday: string; tasks: PlanTask[] }
export interface PlanWeek { week: number; stage: Stage; focus: string; targets: string[]; days: PlanDay[] }
export interface StudyPlan { weeks: PlanWeek[]; generatedAt: number; stage: Stage; daysToExam: number | null }

const CEFR_RANK: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

export function stageFor(cefr: string, target: number): Stage {
  const r = CEFR_RANK[cefr] ?? 2;
  if (r <= 2 || target <= 5.5) return 'Foundation';
  if (r === 3) return 'Intermediate';
  return 'Advanced';
}

const SKILL_TASKS: Record<Skill, (stage: Stage, life: boolean) => Omit<PlanTask, 'id' | 'minutes'>[]> = {
  speaking: (s, life) => life
    ? [{ title: 'Life Skills speaking & listening task', route: '/mock/lifeskills', skill: 'speaking' }]
    : [
      { title: s === 'Foundation' ? 'Speaking Part 1: familiar topics' : 'Speaking Part 2 cue card (timed)', route: '/speaking', skill: 'speaking' },
      { title: 'Speaking Part 3 discussion practice', route: '/speaking', skill: 'speaking' },
    ],
  writing: (s) => [
    { title: s === 'Foundation' ? 'Writing Task 1: describe a chart or write a letter' : 'Writing Task 2 essay (40 min)', route: '/writing', skill: 'writing' },
    { title: 'Rewrite one paragraph using the feedback', route: '/writing', skill: 'writing' },
  ],
  reading: () => [{ title: 'Reading passage with timed questions', route: '/reading', skill: 'reading' }],
  listening: () => [{ title: 'Listening section practice', route: '/listening', skill: 'listening' }],
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function daysUntil(date?: string, now = new Date()) {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86_400_000));
}

/** Deterministic plan: weak skills appear more often, revision days are built in, mocks are spaced out. */
export function generatePlan(p: Pick<Profile, 'testType' | 'currentLevel' | 'target' | 'examDate' | 'dailyMinutes' | 'weakSkills' | 'strongSkills'>, now = new Date()): StudyPlan {
  const life = p.testType === 'lifeskills';
  const skills: Skill[] = life ? ['speaking', 'listening'] : ['listening', 'reading', 'writing', 'speaking'];
  const left = daysUntil(p.examDate, now);
  const weeksTotal = Math.max(1, Math.min(12, left === null ? 8 : Math.ceil(left / 7)));
  const startStage = stageFor(p.currentLevel, p.target);
  const stages: Stage[] = ['Foundation', 'Intermediate', 'Advanced'];
  const s0 = stages.indexOf(startStage);
  // Weighted rotation: weak skills twice, strong skills half as often.
  const weight = (s: Skill) => (p.weakSkills.includes(s) ? 3 : p.strongSkills.includes(s) ? 1 : 2);
  const rotation = skills.flatMap((s) => Array(weight(s)).fill(s) as Skill[]);
  const mins = Math.max(15, p.dailyMinutes);
  const weeks: PlanWeek[] = [];
  let rot = 0;
  for (let w = 0; w < weeksTotal; w++) {
    const stage = stages[Math.min(2, s0 + Math.floor((w / weeksTotal) * (3 - s0)))];
    const finalWeek = w === weeksTotal - 1 && left !== null;
    const days: PlanDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now.getTime() + (w * 7 + d) * 86_400_000);
      const iso = date.toISOString().slice(0, 10);
      if (left !== null && w * 7 + d > left) break;
      const tasks: PlanTask[] = [];
      const id = (k: string) => `${iso}:${k}`;
      const isMockDay = !life && d === 6 && (w % 2 === 1 || finalWeek);
      const isReview = d === 5;
      if (isMockDay && mins >= 60) {
        tasks.push({ id: id('mock'), title: 'Full mock examination', minutes: Math.min(mins, 165), route: '/mock', skill: 'mock' });
      } else if (isMockDay) {
        tasks.push({ id: id('mock'), title: 'Mini mock: one Reading or Listening test', minutes: mins, route: '/mock', skill: 'mock' });
      } else if (isReview) {
        tasks.push({ id: id('review'), title: 'Revise mistakes from this week', minutes: Math.round(mins * 0.5), route: '/progress', skill: 'review' });
        tasks.push({ id: id('vocab'), title: 'Vocabulary review (spaced repetition)', minutes: Math.round(mins * 0.5), route: '/vocabulary', skill: 'vocabulary' });
      } else {
        const main = rotation[rot++ % rotation.length];
        const options = SKILL_TASKS[main](stage, life);
        const t = options[(w + d) % options.length];
        const remaining = mins - 10;
        tasks.push({ ...t, id: id(main), minutes: Math.round(remaining * (stage === 'Foundation' ? 0.6 : 0.75)) });
        if (stage === 'Foundation' || d % 2 === 0) tasks.push({ id: id('grammar'), title: 'Grammar lesson and quiz', minutes: Math.round(remaining * (stage === 'Foundation' ? 0.4 : 0.25)), route: '/grammar', skill: 'grammar' });
        else {
          const second = rotation[rot++ % rotation.length];
          const t2 = SKILL_TASKS[second](stage, life)[0];
          tasks.push({ ...t2, id: id(second + '2'), minutes: Math.round(remaining * 0.25) });
        }
        tasks.push({ id: id('vocab'), title: '10 vocabulary cards', minutes: 10, route: '/vocabulary', skill: 'vocabulary' });
      }
      days.push({ date: iso, weekday: WEEKDAYS[date.getDay()], tasks });
    }
    const weak = p.weakSkills.length ? p.weakSkills.join(' & ') : 'all skills';
    weeks.push({
      week: w + 1, stage, days,
      focus: finalWeek ? 'Exam week: light practice, timing and confidence' : stage === 'Foundation' ? `Build accuracy and core grammar, with extra ${weak}` : stage === 'Intermediate' ? `Extend answers and organise ideas; focus on ${weak}` : `Exam technique and precision under time pressure; polish ${weak}`,
      targets: life
        ? ['3 speaking sessions', '2 listening tasks', '40 vocabulary reviews']
        : [`${stage === 'Advanced' ? 2 : 1} Task 2 essay(s)`, '2 Reading sets', '2 Listening sections', '3 speaking sessions', '50 vocabulary reviews'],
    });
  }
  return { weeks, generatedAt: now.getTime(), stage: startStage, daysToExam: left };
}
