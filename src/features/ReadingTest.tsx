import { useMemo, useState } from 'react';
import { Highlighter, Send, Eraser, BookOpen, ListChecks } from 'lucide-react';
import type { Passage } from '../content/types';
import { markGroups, type MarkResult } from '../lib/marking';
import { rawToBand, readingTable } from '../lib/scoring';
import { db, recordMistakes } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { highlight, QuestionGroups, QuestionNav } from '../components/Questions';
import { TimerChip, useCountdown } from '../components/Timer';
import { Button, Confirm, cx, Tabs } from '../components/ui';
import { TestResult } from './TestResult';

export interface SectionResult { raw: number; total: number; band: number; attemptId: number; mark: MarkResult }

export function ReadingTest({ passages, minutes, mockId, onDone }: { passages: Passage[]; minutes: number; mockId?: string; onDone?: (r: SectionResult) => void }) {
  const profile = useActiveProfile();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marks, setMarks] = useState<string[]>([]);
  const [evidence, setEvidence] = useState('');
  const [result, setResult] = useState<SectionResult | null>(null);
  const [pane, setPane] = useState<'passage' | 'questions'>('passage');
  const [confirm, setConfirm] = useState(false);
  const [startedAt] = useState(Date.now());
  const left = useCountdown(minutes * 60, !result, () => void submit());
  const p = passages[idx];
  const groups = useMemo(() => passages.flatMap((x) => x.groups), [passages]);
  const numbers = groups.flatMap((g) => g.items.map((i) => i.n));
  const test = passages[0].test;

  async function submit() {
    if (result) return;
    const mark = markGroups(groups, answers);
    const band = rawToBand(mark.correct, readingTable(test), mark.total);
    const attemptId = await db.attempts.add({
      profileId: profile.id, kind: 'reading', refId: passages.map((x) => x.id).join('+'), title: passages.length > 1 ? `${test === 'academic' ? 'Academic' : 'General Training'} Reading test` : p.title,
      at: Date.now(), durationSec: Math.round((Date.now() - startedAt) / 1000), band, raw: mark.correct, total: mark.total, data: { answers, byType: mark.byType }, mockId,
    });
    await recordMistakes(profile.id, 'reading', groups.flatMap((g) => g.items.filter((i) => !mark.byItem[i.n]).map((i) => ({ type: g.type, example: i.text }))));
    const r = { raw: mark.correct, total: mark.total, band, attemptId, mark };
    setResult(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onDone?.(r);
  }

  const addHighlight = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 1 && sel.length < 400) setMarks((m) => [...m, sel]);
    window.getSelection()?.removeAllRanges();
  };

  const showEvidence = (ev: string) => {
    const pi = passages.findIndex((x) => x.paragraphs.some((pp) => pp.text.toLowerCase().replace(/[’']/g, "'").includes(ev.toLowerCase().replace(/[’']/g, "'"))));
    if (pi >= 0) setIdx(pi);
    setEvidence(ev);
    setPane('passage');
  };

  const pMarks = [...marks.map((m) => ({ text: m, cls: 'hl' })), ...(evidence ? [{ text: evidence, cls: 'ev' }] : [])];

  return (
    <div className="space-y-4">
      {result && <TestResult kind="Reading" raw={result.raw} total={result.total} band={result.band} byType={result.mark.byType} scaled={result.total !== 40} />}
      <div className="surface sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-2xl p-2 lg:top-2">
        {passages.length > 1 && <Tabs value={String(idx)} onChange={(v) => setIdx(Number(v))} options={passages.map((_, i) => ({ value: String(i), label: `${test === 'general' ? 'Text' : 'Passage'} ${i + 1}` }))} />}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!result && <TimerChip left={left} total={minutes * 60} />}
          {!result && <Button size="sm" variant="secondary" icon={Highlighter} onClick={addHighlight} title="Select text in the passage, then press">Highlight</Button>}
          {marks.length > 0 && <Button size="sm" variant="ghost" icon={Eraser} onClick={() => setMarks([])} aria-label="Clear highlights" />}
          {!result && <Button size="sm" icon={Send} onClick={() => setConfirm(true)}>Submit</Button>}
        </div>
      </div>

      <div className="lg:hidden"><Tabs value={pane} onChange={setPane} options={[{ value: 'passage', label: 'Passage' }, { value: 'questions', label: 'Questions' }]} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className={cx('surface rounded-2xl p-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto', pane !== 'passage' && 'hidden lg:block')}>
          <div className="text-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"><BookOpen className="size-4" />{test === 'academic' ? 'Academic' : 'General Training'} · Section {p.section}</div>
          <h2 className="mt-2 text-xl font-bold">{p.title}</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-7">
            {p.paragraphs.map((para, i) => (
              <p key={i} className="flex gap-3">{para.label && <b className="text-[var(--link)]">{para.label}</b>}<span>{highlight(para.text, pMarks)}</span></p>
            ))}
          </div>
        </article>
        <div className={cx('space-y-4', pane !== 'questions' && 'hidden lg:block')}>
          <div className="surface rounded-2xl p-3"><div className="text-muted mb-2 flex items-center gap-2 text-xs font-semibold"><ListChecks className="size-4" />Question navigator</div><QuestionNav numbers={numbers} answers={answers} review={!!result} correct={result?.mark.byItem} onJump={(n) => { const i = passages.findIndex((x) => x.groups.some((g) => g.items.some((it) => it.n === n))); if (i >= 0) setIdx(i); setPane('questions'); }} /></div>
          <QuestionGroups groups={p.groups} guideSkill={mockId ? undefined : 'reading'} answers={answers} onAnswer={(n, v) => setAnswers((a) => ({ ...a, [n]: v }))} review={!!result} onEvidence={showEvidence} />
          {!result && idx < passages.length - 1 && <Button className="w-full" variant="secondary" onClick={() => { setIdx(idx + 1); window.scrollTo({ top: 0 }); }}>Next {test === 'general' ? 'text' : 'passage'} →</Button>}
        </div>
      </div>
      <Confirm open={confirm} title="Submit your answers?" message={`You have answered ${Object.values(answers).filter(Boolean).length} of ${numbers.length} questions. You cannot change answers after submitting.`} confirmLabel="Submit" onClose={() => setConfirm(false)} onConfirm={submit} />
    </div>
  );
}
