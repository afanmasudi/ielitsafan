import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { BandRing } from './Charts';
import { cx, fmtBand, Notice } from './ui';

export interface Crit { name: string; band: number | null; reasons: string[]; evidence: string[] }

/** Four-criterion breakdown with reasons and evidence. Always labelled as a practice estimate. */
export function CriteriaReport({ criteria, band, label, uncertainty = 1, note }: { criteria: Crit[]; band: number; label: string; uncertainty?: number; note?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-4">
      <div className="surface flex flex-col items-center gap-4 rounded-2xl p-5 sm:flex-row">
        <BandRing band={band} label={label} size={130} />
        <div className="flex-1 text-center sm:text-left">
          <div className="text-muted text-xs font-semibold uppercase tracking-wide">Practice estimate</div>
          <div className="mt-1 text-lg font-semibold">Likely range: Band {fmtBand(Math.max(0, band - uncertainty))} – {fmtBand(Math.min(9, band + uncertainty))}</div>
          <p className="text-muted mt-1 text-sm">Estimated from features in your response that match the public band descriptors. This is not an official IELTS result.</p>
          {note && <p className="mt-2 text-sm text-amber-600 dark:text-amber-300">{note}</p>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map((c, i) => (
          <div key={c.name} className="surface rounded-2xl">
            <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className={cx('grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold text-white', c.band === null ? 'bg-zinc-400' : 'grad-brand')}>{c.band === null ? 'n/a' : fmtBand(c.band)}</span>
              <span className="flex-1 font-medium">{c.name}</span>
              <ChevronDown className={cx('size-4 transition', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <div className="space-y-2 border-t border-soft px-4 py-3 text-sm">
                <ul className="list-disc space-y-1 pl-4">{c.reasons.map((r, k) => <li key={k}>{r}</li>)}</ul>
                {c.evidence.length > 0 && <div className="surface-2 rounded-lg p-2 text-xs"><div className="mb-1 font-semibold">Evidence from your response</div>{c.evidence.map((e, k) => <div key={k}>• {e}</div>)}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <Notice><span className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0" />Automated estimates can be one band or more away from an examiner's mark, especially for content, logic and pronunciation. Use them to spot patterns, not as a prediction.</span></Notice>
    </div>
  );
}
