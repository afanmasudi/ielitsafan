import { useEffect, useState } from 'react';
import { Users, User, Bot, Headphones, Play, CheckCircle2, XCircle } from 'lucide-react';
import type { LifeTest } from '../content/lifeskills';
import { lifeSkillsResult } from '../lib/scoring';
import { words } from '../lib/text';
import { db, type Mock } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { speak } from '../ai/tts';
import { RecordAnswer } from '../components/RecordAnswer';
import { Badge, Button, cx, Notice, Progress } from '../components/ui';

interface Resp { text: string; choice?: number }

/** Minimum words for an answer to count as "developed" at each level. */
const MIN_WORDS = { A1: 5, A2: 12, B1: 25 } as const;

export function scoreLifeSkills(test: LifeTest, resp: Resp[]) {
  const min = MIN_WORDS[test.level];
  const spoken = test.tasks.map((t, i) => ({ t, r: resp[i] })).filter((x) => x.t.kind !== 'listen');
  const listen = test.tasks.map((t, i) => ({ t, r: resp[i] })).filter((x) => x.t.kind === 'listen');
  const exam = spoken.filter((x) => x.t.kind === 'examiner');
  const partner = spoken.filter((x) => x.t.kind === 'partner');
  const share = (arr: typeof spoken, f: (r: Resp) => boolean) => (arr.length ? arr.filter((x) => x.r && f(x.r)).length / arr.length : 1);
  const criteria: Record<string, number> = {
    'Answering and giving information': share(exam, (r) => words(r.text).length >= min),
    'Interacting with your partner': share(partner, (r) => /\?|let'?s|shall we|how about|what about|i agree|good idea|why don'?t|could we|maybe we/i.test(r.text) && words(r.text).length >= Math.max(4, min * 0.6)),
    'Understanding spoken information': share(listen, (r) => r.choice !== undefined && r.choice === listen.find((l) => l.r === r)?.t.answer),
  };
  if (test.level === 'B1') criteria['Giving reasons and opinions'] = share(spoken, (r) => /\bbecause|so that|since|i think|in my opinion|the reason\b/i.test(r.text));
  return { criteria, result: lifeSkillsResult(criteria) };
}

export function LifeSkillsTest({ test }: { test: LifeTest }) {
  const p = useActiveProfile();
  const [i, setI] = useState(-1);
  const [resp, setResp] = useState<Resp[]>([]);
  const [heard, setHeard] = useState(false);
  const task = test.tasks[i];
  const finished = i >= test.tasks.length;

  useEffect(() => {
    if (!task) return;
    setHeard(false);
    void (async () => {
      await speak(task.prompt, 'examinerF');
      if (task.partnerLine) await speak(task.partnerLine, 'usM');
      setHeard(true);
    })();
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!finished) return;
    const { criteria, result } = scoreLifeSkills(test, resp);
    const mock: Mock = { id: crypto.randomUUID(), profileId: p.id, testType: 'lifeskills', startedAt: Date.now(), finishedAt: Date.now(), sections: {}, lifeResult: result };
    void db.mocks.put(mock);
    void db.attempts.add({ profileId: p.id, kind: 'lifeskills', refId: test.level, title: `Life Skills ${test.level}`, at: Date.now(), durationSec: 0, data: { criteria, result, resp }, mockId: mock.id });
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = (r: Resp) => { setResp((x) => [...x, r]); setI(i + 1); };

  if (i < 0) return (
    <div className="surface space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2"><Users className="size-5 text-[var(--accent)]" /><h2 className="text-xl font-bold">IELTS Life Skills {test.level} practice</h2></div>
      <p className="text-muted text-sm">Topic: {test.topic}. In the real test you sit with an examiner and another candidate. Here an AI partner (scripted, with a different voice) plays the other candidate.</p>
      <Notice tone="warn">This simulation cannot reproduce a real paired examination: the partner does not react naturally to everything you say. The result is a Pass/Fail practice estimate, not an IELTS band.</Notice>
      <Button size="lg" icon={Play} onClick={() => setI(0)}>Begin</Button>
    </div>
  );

  if (finished) {
    const { criteria, result } = scoreLifeSkills(test, resp);
    return (
      <div className="space-y-4 animate-fade-up">
        <div className={cx('rounded-3xl p-6 text-white', result === 'Pass' ? 'grad-reading' : 'grad-speaking')}>
          <div className="text-sm font-semibold uppercase opacity-90">Practice estimate · Life Skills {test.level}</div>
          <div className="mt-1 flex items-center gap-2 text-4xl font-extrabold">{result === 'Pass' ? <CheckCircle2 className="size-9" /> : <XCircle className="size-9" />}{result}</div>
          <p className="mt-2 text-sm opacity-90">Based on simple checks of answer length, interaction language and listening answers. A real examiner judges much more than this.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(criteria).map(([k, v]) => <div key={k} className="surface rounded-2xl p-4"><div className="flex justify-between text-sm"><span>{k}</span><b>{Math.round(v * 100)}%</b></div><Progress className="mt-2" value={v} grad={v >= 0.6 ? 'grad-reading' : 'grad-speaking'} /></div>)}
        </div>
        <div className="surface rounded-2xl p-5 text-sm">
          <h3 className="mb-2 font-semibold">Your answers</h3>
          {test.tasks.map((t, k) => <div key={k} className="py-1.5"><div className="text-muted text-xs">{t.prompt}</div><div>{t.kind === 'listen' ? `${t.options![resp[k]?.choice ?? 0]} ${resp[k]?.choice === t.answer ? '✓' : `✗ (answer: ${t.options![t.answer!]})`}` : resp[k]?.text}</div></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Badge tone="brand">Task {i + 1} of {test.tasks.length}</Badge><Progress value={i / test.tasks.length} className="flex-1" /></div>
      <div className="surface flex gap-3 rounded-2xl p-5"><div className="grad-speaking grid size-11 shrink-0 place-items-center rounded-xl text-white"><User className="size-5" /></div><div><div className="text-muted text-xs font-semibold uppercase">Examiner</div><p className="font-medium">{task.prompt}</p></div></div>
      {task.partnerLine && <div className="surface ml-6 flex gap-3 rounded-2xl p-5"><div className="grad-listening grid size-11 shrink-0 place-items-center rounded-xl text-white"><Bot className="size-5" /></div><div><div className="text-muted text-xs font-semibold uppercase">Your partner (simulated)</div><p>{task.partnerLine}</p></div></div>}
      {task.kind === 'listen' ? (
        <div className="surface space-y-3 rounded-2xl p-5">
          <Button variant="secondary" icon={Headphones} onClick={() => void speak(task.listenText!, 'ukM2')}>Play the recording</Button>
          <p className="font-medium">{task.question}</p>
          <div className="grid gap-2">{task.options!.map((o, k) => <Button key={k} variant="secondary" className="justify-start" onClick={() => next({ text: o, choice: k })}>{o}</Button>)}</div>
        </div>
      ) : heard ? <RecordAnswer key={i} onSubmit={(a) => next({ text: a.text })} maxSeconds={test.level === 'B1' ? 90 : 60} /> : <p className="text-muted text-sm">Listening…</p>}
    </div>
  );
}
