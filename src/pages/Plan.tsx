import { useEffect, useState } from 'react';
import { CalendarCheck, RefreshCw, CheckCircle2, Circle, Settings2 } from 'lucide-react';
import { db, getSetting, setSetting, todayKey, type Skill, type StudyDay } from '../lib/db';
import { useActiveProfile, useProfile } from '../lib/profile';
import { generatePlan, type StudyPlan } from '../lib/plan';
import { Badge, Button, cx, Field, inputCls, Modal, PageHeader, Progress } from '../components/ui';

const SKILLS: Skill[] = ['listening', 'reading', 'writing', 'speaking'];

export default function Plan() {
  const p = useActiveProfile();
  const { update } = useProfile();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [days, setDays] = useState<Record<string, StudyDay>>({});
  const [week, setWeek] = useState(0);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ examDate: p.examDate ?? '', dailyMinutes: p.dailyMinutes, target: p.target, weakSkills: p.weakSkills });

  useEffect(() => {
    void getSetting<StudyPlan | null>(`plan:${p.id}`, null).then(async (pl) => {
      if (!pl) { pl = generatePlan(p); await setSetting(`plan:${p.id}`, pl); }
      setPlan(pl);
      const i = pl.weeks.findIndex((w) => w.days.some((d) => d.date === todayKey()));
      setWeek(Math.max(0, i));
    });
    void db.days.where('profileId').equals(p.id).toArray().then((r) => setDays(Object.fromEntries(r.map((d) => [d.date, d]))));
  }, [p]);

  const regenerate = async () => {
    await update({ examDate: form.examDate || undefined, dailyMinutes: form.dailyMinutes, target: form.target, weakSkills: form.weakSkills });
    const pl = generatePlan({ ...p, ...form, examDate: form.examDate || undefined });
    await setSetting(`plan:${p.id}`, pl);
    setPlan(pl); setWeek(0); setEdit(false);
  };

  const toggle = async (date: string, id: string) => {
    const key = `${p.id}:${date}`;
    const row = days[date] ?? { key, profileId: p.id, date, seconds: 0, tasksDone: [] };
    const next = { ...row, tasksDone: row.tasksDone.includes(id) ? row.tasksDone.filter((x) => x !== id) : [...row.tasksDone, id] };
    await db.days.put(next);
    setDays((d) => ({ ...d, [date]: next }));
  };

  if (!plan) return null;
  const w = plan.weeks[week];
  const all = plan.weeks.flatMap((x) => x.days.flatMap((d) => d.tasks.map((t) => ({ d: d.date, t }))));
  const doneCount = all.filter(({ d, t }) => days[d]?.tasksDone.includes(t.id)).length;
  return (
    <div>
      <PageHeader title="Study plan" subtitle={`${plan.weeks.length}-week pathway · starting stage: ${plan.stage}${plan.daysToExam !== null ? ` · ${plan.daysToExam} days to your exam` : ''}`} icon={CalendarCheck}
        actions={<Button variant="secondary" icon={Settings2} onClick={() => setEdit(true)}>Change plan</Button>} />
      <div className="surface mb-4 rounded-2xl p-4"><div className="mb-2 flex justify-between text-sm"><span>Overall progress</span><b>{doneCount}/{all.length} tasks</b></div><Progress value={all.length ? doneCount / all.length : 0} /></div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {plan.weeks.map((x, i) => <button key={i} onClick={() => setWeek(i)} className={cx('shrink-0 rounded-xl px-3 py-2 text-sm font-medium', i === week ? 'grad-brand text-white' : 'surface')}>Week {x.week}</button>)}
      </div>
      <div className="surface mb-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{w.stage}</Badge><h2 className="font-semibold">{w.focus}</h2></div>
        <div className="mt-2 flex flex-wrap gap-1.5">{w.targets.map((t) => <Badge key={t}>{t}</Badge>)}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {w.days.map((d) => (
          <div key={d.date} className={cx('surface rounded-2xl p-4', d.date === todayKey() && 'ring-2 ring-[var(--accent)]')}>
            <div className="mb-2 flex justify-between text-sm"><b>{d.weekday}</b><span className="text-muted">{new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span></div>
            <ul className="space-y-1.5">
              {d.tasks.map((t) => {
                const done = days[d.date]?.tasksDone.includes(t.id);
                return (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <button onClick={() => toggle(d.date, t.id)} aria-label="Toggle done" className="mt-0.5">{done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="text-muted size-4" />}</button>
                    <a href={`#${t.route}`} className={cx('flex-1 hover:underline', done && 'line-through opacity-60')}>{t.title}</a>
                    <span className="text-muted text-xs">{t.minutes}′</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Change your plan">
        <div className="space-y-4">
          <Field label="Exam date"><input type="date" className={inputCls} value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} /></Field>
          <Field label={`Daily study time: ${form.dailyMinutes} min`}><input type="range" min={15} max={180} step={15} value={form.dailyMinutes} onChange={(e) => setForm({ ...form, dailyMinutes: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>
          {p.testType !== 'lifeskills' && <Field label={`Target band: ${form.target.toFixed(1)}`}><input type="range" min={4} max={9} step={0.5} value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>}
          <div><span className="mb-2 block text-sm font-medium">Focus skills (more practice)</span><div className="flex flex-wrap gap-2">{SKILLS.map((s) => <button key={s} onClick={() => setForm({ ...form, weakSkills: form.weakSkills.includes(s) ? form.weakSkills.filter((x) => x !== s) : [...form.weakSkills, s] })} className={cx('rounded-xl border px-3 py-2 text-sm capitalize', form.weakSkills.includes(s) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-soft')}>{s}</button>)}</div></div>
          <Button className="w-full" icon={RefreshCw} onClick={regenerate}>Regenerate plan</Button>
          <p className="text-muted text-xs">Completed tasks from previous days are kept in your history.</p>
        </div>
      </Modal>
    </div>
  );
}
