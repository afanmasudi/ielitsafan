import { useEffect, useState } from 'react';
import { ClipboardCheck, ArrowLeft, Headphones, BookOpen, PenLine, Mic, CheckCircle2, Users, Info } from 'lucide-react';
import { db, type Mock, type Skill, type TestType } from '../lib/db';
import { useActiveProfile, TEST_LABEL } from '../lib/profile';
import { overallBand, writingBand, bandRange, UNCERTAINTY, lifeSkillsResult } from '../lib/scoring';
import { LISTENING } from '../content/listening';
import { readingTest } from '../content/reading';
import { promptsFor } from '../content/writing';
import { buildSpeakingExam } from '../content/speaking';
import { LIFE_TESTS } from '../content/lifeskills';
import { ListeningTest } from '../features/ListeningTest';
import { ReadingTest } from '../features/ReadingTest';
import { WritingTask, type WritingResult } from '../features/WritingTask';
import { SpeakingExam } from '../features/SpeakingExam';
import { LifeSkillsTest } from '../features/LifeSkillsTest';
import { BandRing } from '../components/Charts';
import { Badge, Button, Card, fmtBand, Notice, PageHeader } from '../components/ui';
import { useRoute } from '../lib/router';

const SECTIONS: { skill: Skill; label: string; icon: typeof Mic; time: string }[] = [
  { skill: 'listening', label: 'Listening', icon: Headphones, time: '≈30 min' },
  { skill: 'reading', label: 'Reading', icon: BookOpen, time: '60 min' },
  { skill: 'writing', label: 'Writing', icon: PenLine, time: '60 min' },
  { skill: 'speaking', label: 'Speaking', icon: Mic, time: '11–14 min' },
];

export default function MockPage() {
  const p = useActiveProfile();
  const { path } = useRoute();
  const [mock, setMock] = useState<Mock | null>(null);
  const [life, setLife] = useState<string | null>(path.includes('lifeskills') ? p.lifeLevel ?? 'B1' : null);
  const [history, setHistory] = useState<Mock[]>([]);
  useEffect(() => { void db.mocks.where('profileId').equals(p.id).toArray().then((m) => setHistory(m.sort((a, b) => b.startedAt - a.startedAt))); }, [p.id, mock]);

  if (life) {
    const t = LIFE_TESTS.find((x) => x.level === life)!;
    return <><Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setLife(null)}>Mock Exam Centre</Button><LifeSkillsTest test={t} /></>;
  }
  if (mock) return <MockRunner mock={mock} setMock={setMock} onExit={() => setMock(null)} />;

  const start = async (testType: TestType) => {
    const m: Mock = { id: crypto.randomUUID(), profileId: p.id, testType, startedAt: Date.now(), sections: {} };
    await db.mocks.put(m);
    setMock(m);
  };
  const paths: { t: TestType; desc: string }[] = [
    { t: 'academic', desc: 'Academic Reading (3 long passages) and Academic Writing (visual data + essay).' },
    { t: 'general', desc: 'General Training Reading (everyday, workplace and general texts) and letter writing.' },
    { t: 'ukvi-academic', desc: 'Same content and scoring as Academic, taken under UKVI test-day procedures.' },
    { t: 'ukvi-general', desc: 'Same content and scoring as General Training, under UKVI procedures.' },
  ];
  return (
    <div>
      <PageHeader image="group" title="Mock Exam Centre" subtitle="Full computer-style mock examinations with timers, review, submission and estimated results." icon={ClipboardCheck} grad="grad-gold" />
      <Notice className="mb-6"><span className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" />Academic and General Training share the same Listening and Speaking. Reading and Writing differ. You can stop after any section and resume it later from the history below.</span></Notice>
      <div className="grid gap-4 sm:grid-cols-2">
        {paths.map(({ t, desc }) => (
          <Card key={t} onClick={() => start(t)} className={t === p.testType ? 'ring-2 ring-[var(--accent)]' : ''}>
            {t === p.testType && <Badge tone="brand">Your test</Badge>}
            <h3 className="mt-2 text-lg font-semibold">{TEST_LABEL[t]}</h3>
            <p className="text-muted mt-1 text-sm">{desc}</p>
            <div className="mt-3 flex flex-wrap gap-1">{SECTIONS.map((s) => <Badge key={s.skill}>{s.label} {s.time}</Badge>)}</div>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">IELTS Life Skills</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {LIFE_TESTS.map((t) => (
          <Card key={t.level} onClick={() => setLife(t.level)} className={p.lifeLevel === t.level && p.testType === 'lifeskills' ? 'ring-2 ring-[var(--accent)]' : ''}>
            <div className="flex items-center gap-2"><Users className="size-4 text-[var(--accent)]" /><Badge tone="info">{t.level}</Badge></div>
            <h3 className="mt-2 font-semibold">Life Skills {t.level}</h3>
            <p className="text-muted mt-1 text-sm">Speaking & Listening, about {t.minutes} min. Pass/Fail practice estimate.</p>
          </Card>
        ))}
      </div>
      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Your mocks</h2>
          <div className="space-y-2">
            {history.map((m) => (
              <div key={m.id} className="surface flex flex-wrap items-center gap-3 rounded-2xl p-3">
                <div className="grad-gold grid size-12 place-items-center rounded-xl font-bold text-white">{m.overall !== undefined ? fmtBand(m.overall) : '…'}</div>
                <div className="flex-1"><div className="font-medium">{TEST_LABEL[m.testType]}</div><div className="text-muted text-xs">{new Date(m.startedAt).toLocaleDateString()} · {SECTIONS.map((s) => `${s.label[0]} ${m.sections[s.skill] ? fmtBand(m.sections[s.skill]!.band) : '–'}`).join(' · ')}</div></div>
                <Button size="sm" variant="secondary" onClick={() => setMock(m)}>{m.finishedAt ? 'View results' : 'Resume'}</Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MockRunner({ mock, setMock, onExit }: { mock: Mock; setMock: (m: Mock) => void; onExit: () => void }) {
  const family = mock.testType.includes('general') ? 'general' : 'academic';
  const [active, setActive] = useState<Skill | null>(null);
  const [t1Band, setT1Band] = useState<number | null>(null);
  useEffect(() => {
    // Resuming mid-Writing: reuse a Task 1 already submitted in this mock.
    void db.attempts.where('mockId').equals(mock.id).toArray().then((rows) => {
      const t1 = rows.find((r) => r.kind === 'writing' && (r.data as { task?: number })?.task === 1);
      if (t1?.band !== undefined) setT1Band(t1.band);
    });
  }, [mock.id]);
  const [seed] = useState(() => mock.startedAt);
  const t1 = promptsFor(family, 1)[seed % promptsFor(family, 1).length];
  const t2 = promptsFor(family, 2)[seed % promptsFor(family, 2).length];

  const save = async (skill: Skill, band: number, raw?: number, attemptId?: number) => {
    const sections = { ...mock.sections, [skill]: { band, raw, attemptId } };
    const done = SECTIONS.every((s) => sections[s.skill]);
    const next: Mock = { ...mock, sections, ...(done ? { finishedAt: Date.now(), overall: overallBand({ listening: sections.listening!.band, reading: sections.reading!.band, writing: sections.writing!.band, speaking: sections.speaking!.band }) } : {}) };
    await db.mocks.put(next);
    setMock(next);
  };

  const done = (k: Skill) => !!mock.sections[k];
  if (active) {
    const back = <Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setActive(null)}>Mock overview</Button>;
    if (active === 'listening') return <>{back}<ListeningTest parts={LISTENING} exam mockId={mock.id} onDone={(r) => save('listening', r.band, r.raw, r.attemptId)} /></>;
    if (active === 'reading') return <>{back}<ReadingTest passages={readingTest(family)} minutes={60} mockId={mock.id} onDone={(r) => save('reading', r.band, r.raw, r.attemptId)} /></>;
    if (active === 'speaking') return <>{back}<SpeakingExam steps={buildSpeakingExam(seed)} exam mockId={mock.id} title="Mock Speaking test" onDone={(r) => save('speaking', r.report.band, undefined, r.attemptId)} /></>;
    return (
      <>{back}
        {t1Band === null ? <><h2 className="mb-3 text-lg font-semibold">Writing Task 1 (suggested 20 min)</h2><WritingTask key={t1.id} prompt={t1} exam mockId={mock.id} onDone={(r: WritingResult) => setT1Band(r.report.band)} /></>
          : <><Notice tone="good" className="mb-4">Task 1 submitted (estimate {fmtBand(t1Band)}). Now Task 2, which counts double.</Notice><WritingTask key={t2.id} prompt={t2} exam mockId={mock.id} onDone={(r) => save('writing', writingBand(t1Band, r.report.band), undefined, r.attemptId)} /></>}
      </>
    );
  }

  const s = mock.sections;
  return (
    <div>
      <Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={onExit}>Mock Exam Centre</Button>
      <PageHeader title={`${TEST_LABEL[mock.testType]} mock`} subtitle="Take the sections in order, as on test day. Speaking may be on the same day or within a week of the written tests." icon={ClipboardCheck} grad="grad-gold" />
      {mock.finishedAt && mock.overall !== undefined && (
        <div className="surface mb-6 flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row">
          <BandRing band={mock.overall} label="Overall" size={150} grad={['#f59e0b', '#ef4444']} />
          <div className="flex-1">
            <div className="text-muted text-xs font-semibold uppercase">Estimated overall band (practice)</div>
            <div className="text-2xl font-bold">Band {fmtBand(mock.overall)} <span className="text-muted text-base font-normal">likely {bandRange(mock.overall, UNCERTAINTY.overall).map(fmtBand).join('–')}</span></div>
            <p className="text-muted mt-1 text-sm">Mean of the four skills, rounded with the official half-band rule. Listening and Reading come from your marked answers; Writing and Speaking are automated estimates with wider uncertainty (±1 band).</p>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ skill, label, icon: Icon, time }) => (
          <Card key={skill} onClick={done(skill) ? undefined : () => setActive(skill)}>
            <div className="flex items-center gap-3">
              <div className={`grad-${skill} grid size-11 place-items-center rounded-xl text-white`}><Icon className="size-5" /></div>
              <div className="flex-1"><h3 className="font-semibold">{label}</h3><p className="text-muted text-xs">{time}</p></div>
              {done(skill) ? <div className="text-right"><CheckCircle2 className="ml-auto size-5 text-emerald-500" /><div className="text-lg font-bold">{fmtBand(s[skill]!.band)}</div></div> : <Badge tone="brand">Start</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const lifeResult = lifeSkillsResult;
