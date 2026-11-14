import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Printer, Sparkles, Loader2, Eye, EyeOff, Wand2, Save } from 'lucide-react';
import type { WritingPrompt } from '../content/writing';
import { analyseWriting, type WritingReport } from '../lib/writingAnalysis';
import { applyFixes, countWords } from '../lib/text';
import { db, recordMistakes } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { chat, isLlmReady } from '../ai/llm';
import { TaskChart } from '../components/Charts';
import { CriteriaReport } from '../components/CriteriaReport';
import { TimerChip, useCountdown } from '../components/Timer';
import { Badge, Button, Confirm, cx, inputCls, Notice, Tabs } from '../components/ui';

export interface WritingResult { report: WritingReport; text: string; attemptId: number }

export function WritingTask({ prompt, exam, mockId, onDone, compact }: { prompt: WritingPrompt; exam?: boolean; mockId?: string; onDone?: (r: WritingResult) => void; compact?: boolean }) {
  const profile = useActiveProfile();
  const key = `${profile.id}:${mockId ?? 'practice'}:${prompt.id}`;
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<number | null>(null);
  const [timed, setTimed] = useState(!!exam);
  const [paper, setPaper] = useState(false);
  const [result, setResult] = useState<WritingResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const started = useRef(Date.now());
  const left = useCountdown(prompt.minutes * 60, timed && !result, () => void submit());
  const wc = countWords(text);

  useEffect(() => { void db.drafts.get(key).then((d) => d && setText(d.text)); }, [key]);
  useEffect(() => {
    if (result) return;
    const t = setTimeout(() => { if (text) void db.drafts.put({ key, profileId: profile.id, text, updatedAt: Date.now() }).then(() => setSaved(Date.now())); }, 800);
    return () => clearTimeout(t);
  }, [text, key, profile.id, result]);

  async function submit() {
    if (result) return;
    const report = analyseWriting(text, prompt);
    const attemptId = await db.attempts.add({ profileId: profile.id, kind: 'writing', refId: prompt.id, title: prompt.title, at: Date.now(), durationSec: Math.round((Date.now() - started.current) / 1000), band: report.band, data: { text, task: prompt.task, criteria: report.criteria.map((c) => ({ name: c.name, band: c.band })), wordCount: report.wordCount }, mockId });
    await recordMistakes(profile.id, 'writing', report.issues.map((i) => ({ type: i.type, example: `${i.match} → ${i.suggestion ?? ''}` })));
    await db.drafts.delete(key);
    const r = { report, text, attemptId };
    setResult(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onDone?.(r);
  }

  return (
    <div className="space-y-4">
      <div className={cx('grid gap-4', !compact && 'lg:grid-cols-2')}>
        <div className="surface space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{prompt.task === 1 ? (prompt.kind === 'general-task1' ? `GT Task 1 · ${prompt.tone} letter` : 'Academic Task 1') : `Task 2 · ${prompt.essayType}`}</Badge>
            <Badge>{prompt.task === 1 ? '150+ words · 20 min' : '250+ words · 40 min'}</Badge>
          </div>
          <p className="whitespace-pre-line text-[15px] leading-7">{prompt.prompt}</p>
          {prompt.chart && <TaskChart spec={prompt.chart} />}
        </div>

        {!result ? (
          <div className="surface flex flex-col rounded-2xl p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {timed ? <TimerChip left={left} total={prompt.minutes * 60} /> : !exam && <Button size="sm" variant="secondary" onClick={() => setTimed(true)}>Start {prompt.minutes}-min timer</Button>}
              <span className={cx('rounded-full px-3 py-1 text-sm font-semibold tabular-nums', wc >= (prompt.task === 1 ? 150 : 250) ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'surface-2')}>{wc} words</span>
              {saved && <span className="text-muted flex items-center gap-1 text-xs"><Save className="size-3" />Saved</span>}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" icon={Printer} onClick={() => setPaper(!paper)}>{paper ? 'Type' : 'Paper mode'}</Button>
              </div>
            </div>
            {paper ? (
              <div className="space-y-3">
                <Notice>Handwriting practice: print the answer sheet (or use lined paper), write by hand within the time, then type your answer here to get feedback. Paper-based IELTS is still offered in some locations.</Notice>
                <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print prompt and lined sheet</Button>
                <div className="print-lines hidden print:block" />
              </div>
            ) : null}
            <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} placeholder={prompt.kind === 'general-task1' ? 'Dear …,' : 'Start writing your answer here…'}
              className={cx(inputCls, 'min-h-[50vh] flex-1 resize-y font-[450] leading-7')} aria-label="Your answer" />
            <p className="text-muted mt-2 text-xs">The browser spell-checker is switched off, as in the real computer-delivered test. Drafts autosave on this device.</p>
            <Button className="mt-3" icon={Send} disabled={wc < 20} onClick={() => setConfirm(true)}>Submit for feedback</Button>
          </div>
        ) : !compact && <ModelAnswer prompt={prompt} />}
      </div>
      {result && <WritingFeedback prompt={prompt} result={result} />}
      <Confirm open={confirm} title="Submit your response?" message={`${wc} words. ${wc < (prompt.task === 1 ? 150 : 250) ? 'This is under the minimum word count and will lose marks. ' : ''}You will get feedback straight away.`} confirmLabel="Submit" onClose={() => setConfirm(false)} onConfirm={submit} />
    </div>
  );
}

export function WritingFeedback({ prompt, result }: { prompt: WritingPrompt; result: WritingResult }) {
  const { report, text } = result;
  const [tab, setTab] = useState<'criteria' | 'errors' | 'structure' | 'ai' | 'model'>('criteria');
  const corrected = useMemo(() => applyFixes(text, report.issues), [text, report.issues]);
  return (
    <div className="space-y-4 animate-fade-up">
      <Tabs value={tab} onChange={setTab} options={[{ value: 'criteria', label: 'Band estimate' }, { value: 'errors', label: `Errors (${report.issues.length})` }, { value: 'structure', label: 'Structure & vocabulary' }, { value: 'ai', label: 'AI commentary' }, { value: 'model', label: 'Model answer' }]} />
      {tab === 'criteria' && <CriteriaReport criteria={report.criteria} band={report.band} label={prompt.task === 1 ? 'Task 1' : 'Task 2'} />}
      {tab === 'errors' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface rounded-2xl p-5">
            <h3 className="mb-3 font-semibold">Your response, with errors marked</h3>
            <MarkedText text={text} issues={report.issues} />
          </div>
          <div className="space-y-4">
            <div className="surface rounded-2xl p-5">
              <h3 className="mb-3 font-semibold">Corrections</h3>
              {report.issues.length === 0 ? <p className="text-muted text-sm">No common errors detected. The checker looks for frequent learner mistakes only; ask the AI tutor or a teacher to check meaning and less common errors.</p> : (
                <ul className="space-y-2 text-sm">{report.issues.slice(0, 30).map((i, k) => <li key={k} className="surface-2 rounded-lg p-2"><Badge tone="bad">{i.type}</Badge> <s className="opacity-70">{i.match}</s> → <b className="text-emerald-600 dark:text-emerald-400">{i.suggestion}</b><div className="text-muted mt-0.5 text-xs">{i.message}</div></li>)}</ul>
              )}
            </div>
            {report.issues.length > 0 && <div className="surface rounded-2xl p-5"><h3 className="mb-2 font-semibold">Corrected version (automatic fixes only)</h3><p className="whitespace-pre-line text-sm leading-7">{corrected}</p></div>}
          </div>
        </div>
      )}
      {tab === 'structure' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface rounded-2xl p-5"><h3 className="mb-3 font-semibold">Paragraph analysis</h3><ul className="space-y-2 text-sm">{report.paragraphNotes.map((n, i) => <li key={i} className="surface-2 rounded-lg p-2">{n}</li>)}</ul></div>
          <div className="surface space-y-3 rounded-2xl p-5 text-sm">
            <h3 className="font-semibold">Vocabulary and cohesion</h3>
            <div><b>Lexical diversity (MATTR):</b> {report.stats.mattr.toFixed(2)} <span className="text-muted">(0.70+ is typical of Band 7 essays in our calibration set)</span></div>
            <div><b>Average sentence length:</b> {report.stats.avgSentence.toFixed(1)} words</div>
            <div><b>Complex sentences:</b> {Math.round(report.stats.complexRatio * 100)}%</div>
            <div><b>Linking words used:</b> {Object.keys(report.linkers).length ? Object.entries(report.linkers).map(([w, n]) => `${w} (${n})`).join(', ') : 'none'}</div>
            <div><b>Most repeated:</b> {report.repeated.length ? report.repeated.map(([w, n]) => `${w} ×${n}`).join(', ') : 'no heavy repetition'}</div>
            <Notice>Precise, natural word choice matters more than rare words. Lexical Resource rewards accurate collocations, not complexity for its own sake.</Notice>
          </div>
        </div>
      )}
      {tab === 'ai' && <AiCommentary prompt={prompt} text={text} report={report} />}
      {tab === 'model' && <ModelAnswer prompt={prompt} />}
    </div>
  );
}

function MarkedText({ text, issues }: { text: string; issues: WritingReport['issues'] }) {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  issues.forEach((i, k) => {
    if (i.index < pos) return;
    parts.push(text.slice(pos, i.index));
    parts.push(<mark key={k} title={`${i.message} → ${i.suggestion ?? ''}`} className="rounded bg-rose-500/15 px-0.5 text-inherit underline decoration-rose-500 decoration-wavy">{i.match}</mark>);
    pos = i.index + i.match.length;
  });
  parts.push(text.slice(pos));
  return <p className="whitespace-pre-line text-[15px] leading-7">{parts}</p>;
}

function ModelAnswer({ prompt }: { prompt: WritingPrompt }) {
  const [show, setShow] = useState(true);
  return (
    <div className="surface rounded-2xl p-5">
      <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Model answer for comparison</h3><button onClick={() => setShow(!show)} className="text-muted" aria-label="Toggle model answer">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
      <p className="text-muted mb-3 text-xs">Written for IELTS Studio as an example of a strong (around Band 8) response. There are many valid ways to answer.</p>
      {show && <p className="whitespace-pre-line text-sm leading-7">{prompt.model}</p>}
    </div>
  );
}

function AiCommentary({ prompt, text, report }: { prompt: WritingPrompt; text: string; report: WritingReport }) {
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!isLlmReady()) return (
    <div className="surface rounded-2xl p-5 text-sm">
      <Wand2 className="mb-2 size-6 text-[var(--accent)]" />
      <p>Load a local AI model to get written commentary, sentence rewrites and an improved paragraph. The band estimate above does not depend on it.</p>
      <a href="#/settings" className="mt-3 inline-block"><Button size="sm" icon={Sparkles}>Open the Model Manager</Button></a>
    </div>
  );
  const run = async () => {
    setBusy(true); setErr(''); setOut('');
    try {
      await chat([
        { role: 'system', content: 'You are an experienced IELTS writing teacher. Give concise, specific feedback in British English. Do not give a band score; the scores are calculated separately. Use short headings: Strengths, Priorities, Sentence improvements (quote 3 sentences from the essay and rewrite them), Improved paragraph (rewrite the weakest body paragraph).' },
        { role: 'user', content: `Task: ${prompt.prompt}\n\nAutomated checks found: ${report.criteria.map((c) => `${c.name} ≈ ${c.band}`).join('; ')}. Word count ${report.wordCount}.\n\nEssay:\n${text.slice(0, 3500)}` },
      ], { onToken: setOut, maxTokens: 900 });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="surface space-y-3 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">AI teacher commentary</h3><Badge tone="info">Generated on your device</Badge></div>
      <p className="text-muted text-xs">Small local models can make mistakes. Treat this as advice, not marking. It does not change your band estimate.</p>
      {!out && <Button icon={busy ? Loader2 : Sparkles} disabled={busy} onClick={run}>{busy ? 'Thinking…' : 'Generate commentary'}</Button>}
      {err && <Notice tone="warn">{err}</Notice>}
      {out && <div className="whitespace-pre-line text-sm leading-7">{out}</div>}
    </div>
  );
}
