import { Fragment, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Quote, Lightbulb } from 'lucide-react';
import { cardForType, type StrategyCard } from '../content/strategy';
import type { QGroup, QItem } from '../content/types';
import { isCorrect, TYPE_LABEL } from '../lib/marking';
import { cx } from './ui';

interface Props {
  groups: QGroup[];
  answers: Record<number, string>;
  onAnswer: (n: number, v: string) => void;
  review?: boolean;
  onEvidence?: (text: string) => void;
  /** Shows a “How to approach this” link to the strategy guide (hidden in mock exams). */
  guideSkill?: 'reading' | 'listening';
}

const TF = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YN = ['YES', 'NO', 'NOT GIVEN'];
const LETTERS = 'ABCDEFGH';

export function QuestionGroups({ groups, answers, onAnswer, review, onEvidence, guideSkill }: Props) {
  return (
    <div className="space-y-6">
      {groups.map((g, gi) => {
        const first = g.items[0].n, last = g.items[g.items.length - 1].n;
        return (
          <section key={gi} className="surface rounded-2xl p-4 sm:p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--link)]">Questions {first}{last !== first && `–${last}`} · {TYPE_LABEL[g.type]}
            </div>
            {guideSkill && cardForType(g.type, guideSkill) && <ApproachTip card={cardForType(g.type, guideSkill)!} />}
            <p className="text-muted mb-4 text-sm">{g.instructions}</p>
            {g.options && g.type !== 'map' && (
              <div className="surface-2 mb-4 rounded-xl p-3 text-sm">
                {g.options.map((o) => <div key={o.key} className="flex gap-2 py-0.5"><b className="w-8 shrink-0">{o.key}</b><span>{o.text}</span></div>)}
              </div>
            )}
            {g.map && <MuseumPlan labels={g.map.labels} />}
            {g.table && <GapTable g={g} answers={answers} onAnswer={onAnswer} review={review} />}
            {g.type === 'flow' && <div className="text-muted mb-2 text-center text-xs">Flow chart: read each stage in order ↓</div>}
            <div className="space-y-3">
              {g.items.map((it, idx) => (
                <Fragment key={it.n}>
                  {g.type === 'flow' && idx > 0 && <div className="text-center text-[var(--accent)]">↓</div>}
                  <Item g={g} it={it} value={answers[it.n] ?? ''} onAnswer={onAnswer} review={review} onEvidence={onEvidence} />
                </Fragment>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Item({ g, it, value, onAnswer, review, onEvidence, hideText }: { g: QGroup; it: QItem; value: string; onAnswer: Props['onAnswer']; review?: boolean; onEvidence?: Props['onEvidence']; hideText?: boolean }) {
  const ok = review ? isCorrect(it, g, value) : undefined;
  const choice = (opts: { key: string; label: ReactNode }[], grid = false) => (
    <div className={cx('mt-2 gap-2', grid ? 'flex flex-wrap' : 'grid')}>
      {opts.map((o) => {
        const sel = value === o.key;
        const right = review && it.answer.includes(o.key);
        return (
          <button key={o.key} disabled={review} onClick={() => onAnswer(it.n, sel ? '' : o.key)}
            className={cx('flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition', sel ? 'border-[var(--accent)] bg-[var(--accent)]/10 font-medium' : 'border-soft hover:surface-2', right && 'border-emerald-500 bg-emerald-500/10', review && sel && !right && 'border-rose-500 bg-rose-500/10')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
  const isGap = ['summary', 'notes', 'table', 'sentence', 'short', 'form', 'flow'].includes(g.type);
  return (
    <div id={`q${it.n}`} className={cx('rounded-xl p-2 -m-2 scroll-mt-24', review && (ok ? 'bg-emerald-500/5' : 'bg-rose-500/5'))}>
      <div className="flex items-start gap-3">
        <span className={cx('grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold', value ? 'grad-brand text-white' : 'surface-2')}>{it.n}</span>
        <div className="min-w-0 flex-1">
          {isGap ? (
            <GapLine text={hideText ? `Answer ${it.n}: ___` : it.text} n={it.n} value={value} onAnswer={onAnswer} review={review} maxWords={g.maxWords} />
          ) : (
            <>
              <p className="text-sm font-medium">{it.text}</p>
              {g.type === 'mcq' && it.options && choice(it.options.map((o, i) => ({ key: LETTERS[i], label: <><b>{LETTERS[i]}</b> {o}</> })))}
              {g.type === 'tfng' && choice(TF.map((k) => ({ key: k, label: k })), true)}
              {g.type === 'ynng' && choice(YN.map((k) => ({ key: k, label: k })), true)}
              {g.options && g.type !== 'mcq' && (
                <select disabled={review} value={value} onChange={(e) => onAnswer(it.n, e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-soft bg-[var(--surface)] px-3 text-sm sm:w-auto" aria-label={`Answer for question ${it.n}`}>
                  <option value="">Choose…</option>
                  {g.options.map((o) => <option key={o.key} value={o.key}>{o.key}{g.type === 'map' ? '' : ` – ${o.text.slice(0, 60)}`}</option>)}
                </select>
              )}
              {g.type === 'map' && (
                <select disabled={review} value={value} onChange={(e) => onAnswer(it.n, e.target.value)} className="mt-2 h-11 w-28 rounded-xl border border-soft bg-[var(--surface)] px-3 text-sm" aria-label={`Answer for question ${it.n}`}>
                  <option value="">–</option>{g.map!.labels.map((l) => <option key={l.key}>{l.key}</option>)}
                </select>
              )}
            </>
          )}
          {review && (
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-1.5">{ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-rose-500" />}<span>{ok ? 'Correct' : <>Answer: <b>{it.answer[0]}</b>{value && <span className="text-muted"> (you wrote “{value}”)</span>}</>}</span></div>
              <button onClick={() => onEvidence?.(it.evidence)} className="text-muted flex items-start gap-1.5 text-left text-xs hover:text-[var(--text)]"><Quote className="mt-0.5 size-3.5 shrink-0" /><span>“{it.evidence}”</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GapLine({ text, n, value, onAnswer, review, maxWords }: { text: string; n: number; value: string; onAnswer: Props['onAnswer']; review?: boolean; maxWords?: number }) {
  const [a, b] = text.split('___');
  const words = value.trim() ? value.trim().split(/\s+/).filter((w) => !/^\d/.test(w)).length : 0;
  return (
    <div className="text-sm leading-8">
      {a}
      <input value={value} disabled={review} onChange={(e) => onAnswer(n, e.target.value)} aria-label={`Answer ${n}`} autoComplete="off" autoCapitalize="off" spellCheck={false}
        className={cx('mx-1 inline-block h-9 w-40 max-w-full rounded-lg border bg-[var(--surface)] px-2 align-middle text-sm outline-none focus:border-[var(--accent)]', maxWords && words > maxWords ? 'border-amber-500' : 'border-soft')} />
      {b}
      {maxWords && words > maxWords && <span className="ml-2 text-xs text-amber-600">Max {maxWords} word{maxWords > 1 ? 's' : ''}</span>}
    </div>
  );
}

function GapTable({ g, answers }: { g: QGroup; answers: Record<number, string>; onAnswer: Props['onAnswer']; review?: boolean }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-xl border border-soft">
      <table className="w-full text-sm">
        <thead className="surface-2"><tr>{g.table!.head.map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
        <tbody>
          {g.table!.rows.map((r, i) => (
            <tr key={i} className="border-t border-soft">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2">
                  {c.split(/(\{\d+\})/).map((part, k) => {
                    const m = part.match(/\{(\d+)\}/);
                    return m ? <span key={k} className="mx-0.5 inline-block min-w-12 rounded-md bg-[var(--accent)]/10 px-1.5 font-semibold text-[var(--link)]">({m[1]}) {answers[Number(m[1])] || '……'}</span> : part;
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compact, expandable "how to approach this" help drawn from the Band 8.5 guide. */
function ApproachTip({ card }: { card: StrategyCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 rounded-xl bg-amber-500/8 px-3 py-2 text-xs">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
        <p className="flex-1"><b>Tip:</b> {card.trick}</p>
        <button onClick={() => setOpen(!open)} className="shrink-0 font-semibold text-amber-700 hover:underline dark:text-amber-300">{open ? 'Hide' : 'How to approach this'}</button>
      </div>
      {open && (
        <div className="mt-2 space-y-2 border-t border-amber-500/20 pt-2">
          <ol className="list-decimal space-y-0.5 pl-5">{card.steps.map((x) => <li key={x}>{x}</li>)}</ol>
          <p><b className="text-rose-600">Avoid:</b> {card.donts.join(' ')}</p>
          <p><b>Example:</b> {card.example.task} → <b className="text-emerald-700 dark:text-emerald-400">{card.example.answer}</b></p>
        </div>
      )}
    </div>
  );
}

/** Floor plan used by Listening Part 2. Entrance at the bottom centre. */
export function MuseumPlan({ labels }: { labels: { key: string; x: number; y: number }[] }) {
  return (
    <svg viewBox="0 0 100 74" className="mx-auto mb-4 w-full max-w-md rounded-xl border border-soft" role="img" aria-label="Museum ground floor plan with rooms labelled A to H">
      <rect x="2" y="2" width="96" height="66" rx="2" fill="none" stroke="currentColor" strokeOpacity={0.4} />
      <rect x="40" y="26" width="20" height="20" rx="1.5" fill="#34d399" opacity={0.35} />
      <text x="50" y="37.5" textAnchor="middle" fontSize="3.2" fill="currentColor">Courtyard</text>
      <rect x="42" y="52" width="16" height="6" rx="1" fill="currentColor" opacity={0.12} />
      <text x="50" y="56" textAnchor="middle" fontSize="2.8" fill="currentColor">Reception</text>
      <path d="M2 48 H98 M2 22 H98" stroke="currentColor" strokeOpacity={0.15} strokeDasharray="1.5 1.5" />
      <path d="M44 68 h12" stroke="#ec4899" strokeWidth="2" />
      <text x="50" y="72.5" textAnchor="middle" fontSize="3" fill="currentColor">Main entrance ↑</text>
      {labels.map((l) => (
        <g key={l.key}><rect x={l.x - 6} y={l.y - 4.5} width="12" height="9" rx="1.5" fill="#a78bfa" opacity={0.85} /><text x={l.x} y={l.y + 1.6} textAnchor="middle" fontSize="4.5" fontWeight={700} fill="#1e1b4b">{l.key}</text></g>
      ))}
    </svg>
  );
}

/** Small navigator showing answered / current questions. */
export function QuestionNav({ numbers, answers, review, correct, onJump }: { numbers: number[]; answers: Record<number, string>; review?: boolean; correct?: Record<number, boolean>; onJump?: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {numbers.map((n) => (
        <a key={n} href={`#q${n}`} onClick={(e) => { e.preventDefault(); onJump?.(n); setTimeout(() => document.getElementById(`q${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}
          className={cx('grid size-8 place-items-center rounded-lg text-xs font-semibold', review ? (correct?.[n] ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : answers[n] ? 'grad-brand text-white' : 'surface')}>{n}</a>
      ))}
    </div>
  );
}

/** Wraps matches of the given phrases in <mark>. */
export function highlight(text: string, marks: { text: string; cls: string }[]): ReactNode {
  const valid = marks.filter((m) => m.text.trim().length > 1);
  if (!valid.length) return text;
  const lower = text.toLowerCase().replace(/[’']/g, "'");
  const ranges: { s: number; e: number; cls: string }[] = [];
  for (const m of valid) {
    const needle = m.text.toLowerCase().replace(/[’']/g, "'");
    let i = lower.indexOf(needle);
    while (i !== -1) { ranges.push({ s: i, e: i + needle.length, cls: m.cls }); i = lower.indexOf(needle, i + needle.length); }
  }
  ranges.sort((a, b) => a.s - b.s);
  const out: ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, k) => {
    if (r.s < pos) return;
    out.push(text.slice(pos, r.s), <mark key={k} className={r.cls}>{text.slice(r.s, r.e)}</mark>);
    pos = r.e;
  });
  out.push(text.slice(pos));
  return out;
}
