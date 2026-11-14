import { useEffect, useState } from 'react';
import { Flame, Target, CalendarDays, Clock, CheckCircle2, Circle, Mic, PenLine, BookOpen, Headphones, ShieldCheck } from 'lucide-react';
import { db, getSetting, todayKey, type StudyDay } from '../lib/db';
import { useActiveProfile, TEST_LABEL } from '../lib/profile';
import { daysUntil, type StudyPlan } from '../lib/plan';
import { BandRing } from '../components/Charts';
import { Button, Card, cx, fmtBand, More, Stat } from '../components/ui';
import { useAttempts } from './shared';
import { navigate } from '../lib/router';
import { latestBands, streak } from './progressData';
import { tipOfTheDay } from '../content/strategy';
import { Lightbulb } from 'lucide-react';

export default function Dashboard() {
  const p = useActiveProfile();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [days, setDays] = useState<StudyDay[]>([]);
  const attempts = useAttempts();
  useEffect(() => {
    void getSetting<StudyPlan | null>(`plan:${p.id}`, null).then(setPlan);
    void db.days.where('profileId').equals(p.id).toArray().then(setDays);
  }, [p.id]);

  const today = todayKey();
  const todayPlan = plan?.weeks.flatMap((w) => w.days).find((d) => d.date === today);
  const done = new Set(days.find((d) => d.date === today)?.tasksDone ?? []);
  const bands = latestBands(attempts);
  const left = daysUntil(p.examDate);
  const life = p.testType === 'lifeskills';
  const mins = Math.round((days.find((d) => d.date === today)?.seconds ?? 0) / 60);
  const hour = new Date().getHours();

  const toggle = async (id: string) => {
    const key = `${p.id}:${today}`;
    const row = (await db.days.get(key)) ?? { key, profileId: p.id, date: today, seconds: 0, tasksDone: [] };
    row.tasksDone = row.tasksDone.includes(id) ? row.tasksDone.filter((x) => x !== id) : [...row.tasksDone, id];
    await db.days.put(row);
    setDays((ds) => [...ds.filter((d) => d.key !== key), row]);
  };

  const skills = [
    { k: 'listening', l: 'Listening', i: Headphones, g: 'grad-listening', c: ['#0ea5e9', '#6366f1'] },
    { k: 'reading', l: 'Reading', i: BookOpen, g: 'grad-reading', c: ['#10b981', '#0ea5e9'] },
    { k: 'writing', l: 'Writing', i: PenLine, g: 'grad-writing', c: ['#8b5cf6', '#6366f1'] },
    { k: 'speaking', l: 'Speaking', i: Mic, g: 'grad-speaking', c: ['#f97316', '#ec4899'] },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="surface tile grid overflow-hidden rounded-[28px] md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <p className="text-muted text-[15px] font-semibold">{hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, {p.name}</p>
          <h1 className="mt-1 text-[34px] sm:text-[44px]">{life ? <>Pass <span className="grad-text">Life Skills {p.lifeLevel}</span>.</> : <>Band <span className="grad-text">{p.target.toFixed(1)}</span>. Let’s get there.</>}</h1>
          <p className="text-muted mt-2 text-[17px]">{TEST_LABEL[p.testType]}{plan && ` · ${plan.stage} stage`}{p.placement && ` · placement ${p.placement.cefr}`}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={() => navigate(todayPlan?.tasks.find((t) => !done.has(t.id))?.route ?? '/plan')}>Continue today’s plan</Button>
            <More onClick={() => navigate('/mock')}>Take a mock exam</More>
          </div>
        </div>
        <div className="relative min-h-52 overflow-hidden md:min-h-full">
          <img src="/images/study-800.webp" srcSet="/images/study-800.webp 800w, /images/study-1600.webp 1600w" sizes="(max-width: 768px) 100vw, 500px" alt="" className="photo absolute inset-0 h-full w-full" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Exam in" value={left === null ? '–' : `${left} ${left === 1 ? 'day' : 'days'}`} sub={p.examDate ? new Date(p.examDate).toLocaleDateString() : 'Set a date in your plan'} icon={CalendarDays} />
        <Stat label="Today" value={`${mins} min`} sub={`Goal ${p.dailyMinutes} min`} icon={Clock} grad="grad-reading" />
        <Stat label="Streak" value={`${streak(days)} ${streak(days) === 1 ? 'day' : 'days'}`} sub="Days with study time" icon={Flame} grad="grad-gold" />
        <Stat label="Practice sessions" value={attempts.filter((a) => a.kind !== 'placement').length} sub="All time" icon={Target} grad="grad-speaking" />
      </div>

      {(() => { const t = tipOfTheDay(); return (
        <a href={`#/guide?card=${t.id}`} className="surface flex items-start gap-3 rounded-2xl p-4 transition hover:shadow-lg">
          <span className="grad-gold grid size-10 shrink-0 place-items-center rounded-xl text-white"><Lightbulb className="size-5" /></span>
          <span className="min-w-0"><span className="text-muted block text-xs font-semibold uppercase tracking-wide">Tip of the day · {t.skill}</span><span className="block font-medium">{t.trick}</span><span className="text-muted block text-xs">{t.title}. Open the Band 8.5 Guide →</span></span>
        </a>); })()}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Today’s tasks</h2><a href="#/plan" className="text-sm text-[var(--link)]">Full plan →</a></div>
          {!todayPlan ? <p className="text-muted text-sm">No tasks scheduled today. <a className="underline" href="#/plan">Open your plan</a> to regenerate it.</p> : (
            <ul className="space-y-2">
              {todayPlan.tasks.map((t) => (
                <li key={t.id} className="surface-2 flex items-center gap-3 rounded-xl p-3">
                  <button onClick={() => toggle(t.id)} aria-label={done.has(t.id) ? 'Mark not done' : 'Mark done'}>{done.has(t.id) ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="text-muted size-5" />}</button>
                  <a href={`#${t.route}`} className={cx('flex-1 text-sm font-medium', done.has(t.id) && 'line-through opacity-60')}>{t.title}</a>
                  <span className="text-muted text-xs">{t.minutes} min</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Latest estimates</h2>
          <div className="grid grid-cols-2 gap-3">
            {skills.filter((s) => !life || s.k === 'listening' || s.k === 'speaking').map((s) => (
              <a key={s.k} href={`#/${s.k}`} className="surface-2 flex flex-col items-center rounded-2xl p-3">
                <BandRing band={bands[s.k] ?? null} size={76} label={s.l} grad={s.c as unknown as [string, string]} />
              </a>
            ))}
          </div>
          <p className="text-muted mt-3 text-xs">Estimates are from your most recent attempts. {Object.keys(bands).length === 0 && 'Complete a practice task to see your first estimate.'}</p>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {skills.map((s) => (
          <Card key={s.k} onClick={() => navigate(`/${s.k}`)}>
            <div className={`${s.g} mb-3 grid size-10 place-items-center rounded-xl text-white`}><s.i className="size-5" /></div>
            <h3 className="font-semibold">{s.l} Lab</h3>
            <p className="text-muted text-sm">{bands[s.k] !== undefined ? `Latest ${fmtBand(bands[s.k])}` : 'Not tried yet'}</p>
          </Card>
        ))}
      </div>
      <p className="text-muted flex items-center gap-2 text-xs"><ShieldCheck className="size-4 text-emerald-500" />All data is stored only in this browser. Export a backup from Settings.</p>
    </div>
  );
}
