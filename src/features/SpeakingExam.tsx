import { useEffect, useReducer, useRef, useState } from 'react';
import { Volume2, Play, Timer, User, CheckCircle2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { examReducer, initExam, current, partProgress, type Step } from '../lib/speakingMachine';
import { analyseSpeaking, type SpeakingReport, type Turn } from '../lib/speakingAnalysis';
import { PART1_FOLLOWUPS } from '../content/speaking';
import { db, recordMistakes } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { speak, stopSpeaking } from '../ai/tts';
import { chat, isLlmReady } from '../ai/llm';
import { words } from '../lib/text';
import { remember } from '../lib/questionHistory';
import { RecordAnswer } from '../components/RecordAnswer';
import { TimerChip, useCountdown } from '../components/Timer';
import { CriteriaReport } from '../components/CriteriaReport';
import { ModelStatus } from '../components/ModelStatus';
import { Badge, Button, cx, inputCls, Notice, Progress } from '../components/ui';

/** Fluency metrics stored with each attempt, used for pattern analysis across sessions. */
export function speakingMetrics(report: SpeakingReport, turns: Turn[]) {
  const total = turns.reduce((n, t) => n + words(t.answer).length, 0);
  const fill = Object.values(report.fillers).reduce((a, b) => a + b, 0);
  const voiced = turns.reduce((n, t) => n + (t.audio?.voiced ?? 0), 0);
  const pauses = turns.reduce((n, t) => n + (t.audio?.longPauses ?? 0), 0);
  return { wpm: report.wpm, fillersPer100: total ? (fill / total) * 100 : 0, avgAnswerWords: turns.length ? total / turns.length : 0, pausesPerMin: voiced > 10 ? pauses / (voiced / 60) : null, band: report.band };
}

export interface SpeakingResult { report: SpeakingReport; turns: Turn[]; attemptId: number }

async function followUpFor(step: Step, answer: string): Promise<string | null> {
  if (step.part === 1) return words(answer).length < 10 ? PART1_FOLLOWUPS[Math.floor(Math.random() * PART1_FOLLOWUPS.length)] : null;
  if (step.part !== 3 || !isLlmReady() || words(answer).length < 6) return null;
  try {
    const q = await chat([
      { role: 'system', content: 'You are an IELTS Speaking examiner in Part 3. Ask exactly ONE short follow-up question (under 20 words) that develops the topic of the candidate\'s answer in a more abstract or general direction. Never comment on, praise or correct the answer. Never give hints. Output only the question.' },
      { role: 'user', content: `Examiner question: ${step.text}\nCandidate answer: ${answer.slice(0, 800)}` },
    ], { maxTokens: 60, temperature: 0.7 });
    const line = q.split('\n').map((s) => s.trim().replace(/^["“]|["”]$/g, '')).find((s) => s.endsWith('?'));
    // Small models sometimes echo the examiner's question; reject anything that repeats it.
    if (!line || words(line).length > 25 || line.toLowerCase().includes(step.text.toLowerCase().replace(/\?$/, ''))) return null;
    return line;
  } catch { return null; }
}

export function SpeakingExam({ steps, exam, mockId, onDone, title = 'Speaking test' }: { steps: Step[]; exam?: boolean; mockId?: string; onDone?: (r: SpeakingResult) => void; title?: string }) {
  const profile = useActiveProfile();
  const [s, dispatch] = useReducer(examReducer, steps, initExam);
  const [speaking, setSpeaking] = useState(false);
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [notes, setNotes] = useState('');
  const [thinking, setThinking] = useState(false);
  const started = useRef(Date.now());
  const step = current(s);
  const prog = partProgress(s);

  // The examiner speaks each new step once.
  useEffect(() => {
    if (!step || step.kind === 'prep') return;
    let cancelled = false;
    setSpeaking(true);
    void speak(step.kind === 'cue' ? `Here is your topic. ${step.text}` : step.text, 'examinerF').then(() => {
      if (cancelled) return;
      setSpeaking(false);
      if (step.kind === 'say') dispatch({ type: 'advance' });
    });
    return () => { cancelled = true; stopSpeaking(); };
  }, [step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s.status !== 'finished' || result) return;
    void (async () => {
      const report = analyseSpeaking(s.turns);
      const attemptId = await db.attempts.add({ profileId: profile.id, kind: 'speaking', refId: 'exam', title, at: Date.now(), durationSec: Math.round((Date.now() - started.current) / 1000), band: report.band, data: { turns: s.turns, criteria: report.criteria.map((c) => ({ name: c.name, band: c.band })), metrics: speakingMetrics(report, s.turns) }, mockId });
      await remember(profile.id, s.steps.filter((x) => x.kind === 'question' || x.kind === 'cue').map((x) => x.text));
      await recordMistakes(profile.id, 'speaking', report.issues.map((i) => ({ type: i.type, example: `${i.match} → ${i.suggestion ?? ''}` })));
      const r = { report, turns: s.turns, attemptId };
      setResult(r);
      onDone?.(r);
    })();
  }, [s.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = async (a: { text: string; audio?: Turn['audio']; typed: boolean }) => {
    const st = step!;
    dispatch({ type: 'answer', text: a.text, audio: a.audio, typed: a.typed });
    if (st.kind === 'question' && !st.followUp) {
      setThinking(true);
      const fu = await followUpFor(st, a.text);
      setThinking(false);
      if (fu) dispatch({ type: 'followUp', text: fu });
    }
  };

  if (s.status === 'ready') return (
    <div className="surface space-y-4 rounded-2xl p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
        <li>The examiner asks one question at a time. Answer, then submit to continue.</li>
        <li>Part 2: one minute to prepare, then up to two minutes to speak. Recording starts automatically.</li>
        <li>Feedback appears only when the whole test is finished, as in the real exam.</li>
        <li>Speech is transcribed on this device. You can type answers instead at any point.</li>
      </ul>
      <ModelStatus show={['stt', 'tts', 'llm']} />
      <Button size="lg" icon={Play} className="grad-speaking" onClick={() => { started.current = Date.now(); dispatch({ type: 'start' }); }}>Begin</Button>
    </div>
  );

  if (s.status === 'finished') return result ? <SpeakingFeedback result={result} /> : <div className="surface flex items-center gap-2 rounded-2xl p-6"><Loader2 className="size-5 animate-spin" />Preparing feedback…</div>;

  return (
    <div className="space-y-4">
      <div className="surface flex flex-wrap items-center gap-3 rounded-2xl p-3">
        {[1, 2, 3].filter((p) => steps.some((x) => x.part === p)).map((p) => <Badge key={p} tone={prog.part === p ? 'brand' : prog.part > p ? 'good' : 'neutral'}>{prog.part > p && <CheckCircle2 className="size-3" />}Part {p}</Badge>)}
        <Progress value={prog.overall} className="min-w-24 flex-1" grad="grad-speaking" />
      </div>

      <div className="surface relative overflow-hidden rounded-3xl p-6">
        <div className="grad-speaking absolute -right-16 -top-16 size-48 rounded-full opacity-10 blur-2xl" />
        <div className="flex items-start gap-4">
          <div className={cx('grad-speaking grid size-14 shrink-0 place-items-center rounded-2xl text-white', speaking && 'animate-pulse-ring')}><User className="size-7" /></div>
          <div className="min-w-0 flex-1">
            <div className="text-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">Examiner {speaking && <Volume2 className="size-3.5 animate-pulse" />}</div>
            {step?.kind !== 'prep' && <p className="mt-1 text-lg font-medium">{step?.kind === 'cue' ? 'Here is your topic.' : step?.text}</p>}
            {thinking && <p className="text-muted mt-1 flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" />…</p>}
          </div>
          {step && step.kind !== 'say' && <button onClick={() => void speak(step.text, 'examinerF')} className="text-muted rounded-lg p-2 hover:surface-2" aria-label="Repeat the question" title="Ask the examiner to repeat"><RefreshCw className="size-4" /></button>}
        </div>
      </div>

      {step && (step.kind === 'cue' || step.kind === 'prep' || step.kind === 'talk') && (() => {
        const cue = s.steps.find((x) => x.kind === 'cue')!;
        return (
          <div className="rounded-2xl border-2 border-dashed border-orange-400/60 bg-orange-500/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300">Task card</div>
            <p className="mt-1 text-lg font-semibold">{cue.text}</p>
            <p className="mt-2 text-sm">You should say:</p>
            <ul className="mt-1 list-disc pl-5 text-sm">{cue.bullets?.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        );
      })()}

      {step?.kind === 'cue' && <Button size="lg" icon={Timer} disabled={speaking} onClick={() => dispatch({ type: 'advance' })}>Start one-minute preparation</Button>}
      {step?.kind === 'prep' && <PrepStep notes={notes} setNotes={setNotes} onDone={() => dispatch({ type: 'advance' })} />}
      {step?.kind === 'talk' && !speaking && <TalkStep notes={notes} onSubmit={answer} />}
      {step?.kind === 'question' && !speaking && !thinking && <RecordAnswer key={step.id} onSubmit={answer} maxSeconds={step.part === 1 ? 60 : 90} />}
      {step?.kind === 'say' && !speaking && <Button variant="secondary" onClick={() => dispatch({ type: 'advance' })}>Continue</Button>}
      {exam && <p className="text-muted text-xs">Mock mode: no hints or feedback until the test ends.</p>}
    </div>
  );
}

function PrepStep({ notes, setNotes, onDone }: { notes: string; setNotes: (s: string) => void; onDone: () => void }) {
  const left = useCountdown(60, true, onDone);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><TimerChip left={left} total={60} label="Preparation" /><Button size="sm" variant="secondary" onClick={onDone}>I'm ready to speak</Button></div>
      <textarea className={cx(inputCls, 'min-h-28')} placeholder="Notes (keywords only)…" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </div>
  );
}

function TalkStep({ notes, onSubmit }: { notes: string; onSubmit: (a: { text: string; typed: boolean; audio?: Turn['audio'] }) => void }) {
  return (
    <div className="space-y-3">
      {notes && <div className="surface-2 rounded-xl p-3 text-sm"><b>Your notes:</b> {notes}</div>}
      <Notice>Speak for up to two minutes. Recording stops automatically at 2:00. Keep going until then if you can.</Notice>
      <RecordAnswer onSubmit={onSubmit} maxSeconds={120} autoStart submitLabel="Finish long turn" />
    </div>
  );
}

export function SpeakingFeedback({ result }: { result: SpeakingResult }) {
  const { report, turns } = result;
  const [ai, setAi] = useState('');
  const [busy, setBusy] = useState(false);
  const runAi = async () => {
    setBusy(true);
    try {
      await chat([
        { role: 'system', content: 'You are an IELTS speaking teacher. From the transcript, give: 3 strengths, 3 priorities, and rewrite two of the weakest answers as natural Band 7 answers in the candidate\'s own ideas. Do not score. Do not comment on accent. Note that transcripts come from speech recognition and may contain recognition errors.' },
        { role: 'user', content: turns.map((t) => `Q (Part ${t.part}): ${t.question}\nA: ${t.answer}`).join('\n\n').slice(0, 5000) },
      ], { onToken: setAi, maxTokens: 900 });
    } catch (e) { setAi((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="space-y-4 animate-fade-up">
      <CriteriaReport criteria={report.criteria} band={report.band} label="Speaking" note="Provisional: based on 3 of 4 criteria. Pronunciation is not scored automatically." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-2 rounded-2xl p-5 text-sm">
          <h3 className="font-semibold">Fluency observations</h3>
          <div><b>Speech rate:</b> {report.wpm ? `${report.wpm} words/min of voiced speech` : 'not measured (typed answers)'}</div>
          <div><b>Fillers:</b> {Object.keys(report.fillers).length ? Object.entries(report.fillers).map(([f, n]) => `${f} ×${n}`).join(', ') : 'none detected'}</div>
          <div><b>Repeated words:</b> {report.repeated.length ? report.repeated.map(([w, n]) => `${w} ×${n}`).join(', ') : 'none'}</div>
          {report.issues.length > 0 && <div><b>Grammar flags:</b><ul className="mt-1 list-disc pl-5">{report.issues.slice(0, 8).map((i, k) => <li key={k}>“{i.match}” → “{i.suggestion}”</li>)}</ul></div>}
        </div>
        <div className="surface rounded-2xl p-5 text-sm">
          <h3 className="mb-2 font-semibold">Your practice exercise</h3>
          <p>{report.exercise}</p>
          <h3 className="mb-2 mt-4 font-semibold">AI teacher comments</h3>
          {isLlmReady() ? (ai ? <p className="whitespace-pre-line">{ai}</p> : <Button size="sm" icon={busy ? Loader2 : Sparkles} disabled={busy} onClick={runAi}>Generate comments</Button>) : <p className="text-muted">Load a local model in Settings to get written comments and improved sample answers.</p>}
        </div>
      </div>
      <div className="surface rounded-2xl p-5">
        <h3 className="mb-3 font-semibold">Transcript</h3>
        <div className="space-y-3 text-sm">{turns.map((t, i) => <div key={i}><div className="text-muted text-xs">Part {t.part} · {t.question}</div><p className="mt-0.5">{t.answer} {t.typed && <Badge>typed</Badge>}</p></div>)}</div>
      </div>
    </div>
  );
}
