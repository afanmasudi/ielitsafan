import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react';
import { useActiveProfile, useProfile } from '../lib/profile';
import { db, type Profile, type Skill, type TestType, type LifeLevel } from '../lib/db';
import { PLACEMENT, placementLevel } from '../content/grammar';
import { generatePlan } from '../lib/plan';
import { setSetting } from '../lib/db';
import { Button, cx, inputCls, Progress } from '../components/ui';
import { Brand } from '../components/Layout';

const SKILLS: Skill[] = ['listening', 'reading', 'writing', 'speaking'];
const LEVELS = [
  { v: 'A2', l: 'Beginner–Elementary', d: 'I can handle simple everyday conversations.' },
  { v: 'B1', l: 'Intermediate', d: 'I can talk about familiar topics but make frequent mistakes.' },
  { v: 'B2', l: 'Upper-intermediate', d: 'I communicate well but lack precision in complex topics.' },
  { v: 'C1', l: 'Advanced', d: 'I am fluent and want to polish for a high band.' },
];

function Choice({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc?: string }) {
  return (
    <button onClick={onClick} className={cx('surface flex w-full items-start gap-3 rounded-2xl p-4 text-left transition', active ? 'ring-2 ring-[var(--accent)]' : 'hover:surface-2')}>
      <span className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border', active ? 'grad-brand border-transparent text-white' : 'border-soft')}>{active && <Check className="size-3" />}</span>
      <span><span className="block font-medium">{title}</span>{desc && <span className="text-muted block text-sm">{desc}</span>}</span>
    </button>
  );
}

export default function Onboarding() {
  const p = useActiveProfile();
  const { update } = useProfile();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Partial<Profile> & { ukvi?: boolean; family?: 'academic' | 'general' | 'lifeskills' }>({ family: 'academic', ukvi: false, currentLevel: p.currentLevel, target: 6.5, dailyMinutes: 45, weakSkills: [], strongSkills: [], lifeLevel: 'B1' });
  const [answers, setAnswers] = useState<(number | null)[]>(PLACEMENT.map(() => null));
  const life = d.family === 'lifeskills';
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }));
  const toggle = (k: 'weakSkills' | 'strongSkills', s: Skill) => set({ [k]: d[k]!.includes(s) ? d[k]!.filter((x) => x !== s) : [...d[k]!, s] });

  const finish = async (skipPlacement: boolean) => {
    const correct = answers.map((a, i) => a === PLACEMENT[i].answer);
    const cefr = skipPlacement ? d.currentLevel! : placementLevel(correct);
    const testType: TestType = life ? 'lifeskills' : d.ukvi ? (d.family === 'general' ? 'ukvi-general' : 'ukvi-academic') : d.family!;
    const profile: Partial<Profile> = {
      testType, lifeLevel: life ? d.lifeLevel : undefined, currentLevel: cefr, target: life ? 0 : d.target!, examDate: d.examDate || undefined,
      dailyMinutes: d.dailyMinutes!, weakSkills: d.weakSkills!, strongSkills: d.strongSkills!, onboarded: true,
      placement: skipPlacement ? undefined : { score: correct.filter(Boolean).length, total: PLACEMENT.length, cefr, at: Date.now() },
    };
    if (!skipPlacement) await db.attempts.add({ profileId: p.id, kind: 'placement', refId: 'placement', title: 'Placement test', at: Date.now(), durationSec: 0, raw: profile.placement!.score, total: PLACEMENT.length });
    await setSetting(`plan:${p.id}`, generatePlan({ ...(p as Profile), ...(profile as Profile) }));
    await update(profile);
  };

  const steps = [
    {
      title: 'Which test are you preparing for?',
      body: (
        <div className="space-y-3">
          <Choice active={d.family === 'academic'} onClick={() => set({ family: 'academic' })} title="IELTS Academic" desc="For university study or professional registration." />
          <Choice active={d.family === 'general'} onClick={() => set({ family: 'general' })} title="IELTS General Training" desc="For work, training or migration." />
          <Choice active={life} onClick={() => set({ family: 'lifeskills' })} title="IELTS Life Skills (A1, A2 or B1)" desc="Speaking and Listening only, graded Pass or Fail. Often for UK family or settlement visas." />
          {!life && (
            <label className="surface flex items-center gap-3 rounded-2xl p-4">
              <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={d.ukvi} onChange={(e) => set({ ukvi: e.target.checked })} />
              <span><span className="block font-medium">I need IELTS for UKVI</span><span className="text-muted text-sm">Same content and scoring as standard IELTS; different test-day procedures.</span></span>
            </label>
          )}
          {life && <div className="grid grid-cols-3 gap-2">{(['A1', 'A2', 'B1'] as LifeLevel[]).map((l) => <Choice key={l} active={d.lifeLevel === l} onClick={() => set({ lifeLevel: l })} title={l} />)}</div>}
        </div>
      ),
    },
    {
      title: 'How would you describe your English now?',
      body: <div className="space-y-3">{LEVELS.map((l) => <Choice key={l.v} active={d.currentLevel === l.v} onClick={() => set({ currentLevel: l.v })} title={l.l} desc={l.d} />)}</div>,
    },
    {
      title: life ? 'When is your test?' : 'Your target and test date',
      body: (
        <div className="space-y-5">
          {!life && (
            <div>
              <div className="mb-2 flex items-baseline justify-between"><span className="font-medium">Target overall band</span><span className="grad-text text-3xl font-extrabold">{d.target!.toFixed(1)}</span></div>
              <input type="range" min={4} max={9} step={0.5} value={d.target} onChange={(e) => set({ target: Number(e.target.value) })} className="w-full accent-[var(--accent)]" />
            </div>
          )}
          {life && <p className="text-muted text-sm">Your goal is a Pass at {d.lifeLevel}.</p>}
          <label className="block"><span className="mb-1.5 block font-medium">Exam date (optional)</span><input type="date" className={inputCls} value={d.examDate ?? ''} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ examDate: e.target.value })} /></label>
          <div>
            <span className="mb-2 block font-medium">Daily study time</span>
            <div className="grid grid-cols-4 gap-2">{[20, 45, 60, 120].map((m) => <Choice key={m} active={d.dailyMinutes === m} onClick={() => set({ dailyMinutes: m })} title={m < 60 ? `${m} min` : `${m / 60} h`} />)}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Strongest and weakest skills',
      body: (
        <div className="space-y-5">
          {(['strongSkills', 'weakSkills'] as const).map((k) => (
            <div key={k}>
              <span className="mb-2 block font-medium">{k === 'strongSkills' ? 'I feel confident in…' : 'I need most help with…'}</span>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.filter((s) => !life || s === 'speaking' || s === 'listening').map((s) => <Choice key={s} active={d[k]!.includes(s)} onClick={() => toggle(k, s)} title={s[0].toUpperCase() + s.slice(1)} />)}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Quick placement check (12 questions)',
      body: (
        <div className="space-y-4">
          <p className="text-muted text-sm">This short grammar and vocabulary check helps set the starting stage of your plan. It is not an IELTS score.</p>
          {PLACEMENT.map((q, i) => (
            <div key={i} className="surface rounded-2xl p-4">
              <p className="font-medium">{i + 1}. {q.q}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, j) => <button key={j} onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))} className={cx('rounded-xl border px-3 py-2 text-left text-sm transition', answers[i] === j ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-soft hover:surface-2')}>{o}</button>)}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Brand />
      <div className="mt-8 flex items-center gap-3"><GraduationCap className="size-5 text-[var(--accent)]" /><span className="text-muted text-sm">Step {step + 1} of {steps.length}</span></div>
      <Progress value={(step + 1) / steps.length} className="mt-2" />
      <h1 className="mt-6 text-2xl font-bold">{steps[step].title}</h1>
      <div className="mt-5 animate-fade-up" key={step}>{steps[step].body}</div>
      <div className="sticky bottom-0 mt-8 flex justify-between gap-3 bg-[var(--bg)] py-4">
        <Button variant="secondary" icon={ArrowLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        <div className="flex gap-2">
          {last && <Button variant="ghost" onClick={() => finish(true)}>Skip check</Button>}
          {last ? <Button icon={Check} disabled={answers.some((a) => a === null)} onClick={() => finish(false)}>Create my plan</Button> : <Button onClick={() => setStep(step + 1)}>Continue <ArrowRight className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );
}
