import { useEffect, useState, type ReactNode } from 'react';
import { Compass, Eye, ListOrdered, CheckCircle2, XCircle, Lightbulb, PencilLine, ChevronDown, Clock, Target, ExternalLink, CalendarCheck } from 'lucide-react';
import { EXAM_DAY, GUIDES, GUIDE_SOURCES, type StrategyCard } from '../content/strategy';
import { useRoute, navigate } from '../lib/router';
import { Button, cx, PageHeader, Tabs } from '../components/ui';

type Tab = 'reading' | 'listening' | 'writing' | 'speaking' | 'examday';
const GRAD: Record<string, string> = { reading: 'grad-reading', listening: 'grad-listening', writing: 'grad-writing', speaking: 'grad-speaking', examday: 'grad-gold' };

export default function Guide() {
  const { query } = useRoute();
  const deep = query.get('card');
  const initial = (GUIDES.find((g) => g.cards.some((c) => c.id === deep))?.skill ?? (query.get('skill') as Tab | null) ?? 'reading') as Tab;
  const [tab, setTab] = useState<Tab>(initial);
  const [open, setOpen] = useState<string | null>(deep ?? GUIDES.find((g) => g.skill === initial)?.cards[0].id ?? null);

  useEffect(() => {
    if (!deep) return;
    setTab(initial); setOpen(deep);
    setTimeout(() => document.getElementById(`card-${deep}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [deep]); // eslint-disable-line react-hooks/exhaustive-deps

  const guide = GUIDES.find((g) => g.skill === tab);
  return (
    <div>
      <PageHeader title="Band 8.5 Strategy Guide" subtitle="Exactly how to approach each paper, task and question type, with tricks to remember and worked examples." icon={Compass} grad="grad-brand" />
      <Tabs className="mb-5" value={tab} onChange={(t) => { setTab(t); setOpen(GUIDES.find((g) => g.skill === t)?.cards[0].id ?? null); }}
        options={[...GUIDES.map((g) => ({ value: g.skill as Tab, label: g.label })), { value: 'examday', label: 'Exam day' }]} />

      {guide && (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <div className={cx(GRAD[tab], 'rounded-2xl p-5 text-white')}>
              <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Target className="size-4" />What Band 8.5 looks like</div>
              <ul className="mt-2 space-y-1.5 text-sm">{guide.band85.map((b) => <li key={b} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{b}</li>)}</ul>
            </div>
            <div className="surface rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><Clock className="size-4 text-[var(--accent)]" />Time plan</div>
              <ul className="text-muted mt-2 space-y-1.5 text-sm">{guide.timePlan.map((b) => <li key={b}>• {b}</li>)}</ul>
            </div>
          </div>
          <div className="space-y-3">{guide.cards.map((c) => <Card key={c.id} c={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} grad={GRAD[tab]} />)}</div>
        </>
      )}

      {tab === 'examday' && (
        <div className="grid gap-3 md:grid-cols-3">
          {(['before', 'during', 'after'] as const).map((k) => (
            <div key={k} className="surface rounded-2xl p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold capitalize"><CalendarCheck className="size-4 text-amber-500" />{k === 'during' ? 'During each paper' : `${k} the test`}</h3>
              <ul className="space-y-2 text-sm">{EXAM_DAY[k].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{x}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      <section className="text-muted mt-8 text-xs">
        <p className="mb-1 font-semibold">Based on (summarised in our own words):</p>
        <ul className="space-y-0.5">{GUIDE_SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:underline">{s.label}<ExternalLink className="size-3" /></a></li>)}</ul>
        <p className="mt-2">Official facts come from IELTS.org/IDP; the step-by-step methods and memory tricks are teaching advice.</p>
      </section>
    </div>
  );
}

function Card({ c, open, onToggle, grad }: { c: StrategyCard; open: boolean; onToggle: () => void; grad: string }) {
  return (
    <article id={`card-${c.id}`} className={cx('surface scroll-mt-20 overflow-hidden rounded-2xl', open && 'ring-2 ring-[var(--accent)]/30')}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
        <span className={cx(grad, 'grid size-9 shrink-0 place-items-center rounded-xl text-white')}><Lightbulb className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{c.title}</span>
          {!open && <span className="text-muted block truncate text-xs">{c.trick}</span>}
        </span>
        <ChevronDown className={cx('size-5 shrink-0 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-soft p-4 text-sm animate-fade-up">
          <div className="rounded-xl bg-amber-500/10 p-3"><div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"><Lightbulb className="size-3.5" />Remember</div><p className="font-medium">{c.trick}</p></div>
          <Row icon={Eye} title="How to look at it"><p>{c.look}</p></Row>
          <Row icon={ListOrdered} title="Steps"><ol className="list-decimal space-y-1 pl-5">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol></Row>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-500/8 p-3"><div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-3.5" />Do</div><ul className="space-y-1">{c.dos.map((d) => <li key={d}>• {d}</li>)}</ul></div>
            <div className="rounded-xl bg-rose-500/8 p-3"><div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-rose-700 dark:text-rose-300"><XCircle className="size-3.5" />Don’t</div><ul className="space-y-1">{c.donts.map((d) => <li key={d}>• {d}</li>)}</ul></div>
          </div>
          <Row icon={PencilLine} title="Worked example">
            <div className="surface-2 space-y-1.5 rounded-xl p-3">
              <p><b>Task:</b> {c.example.task}</p>
              <p className="text-muted"><b className="text-[var(--text)]">Thinking:</b> {c.example.thinking}</p>
              <p><b>Answer:</b> <span className="font-semibold text-emerald-700 dark:text-emerald-400">{c.example.answer}</span></p>
            </div>
          </Row>
          {c.route && <Button size="sm" variant="soft" onClick={() => navigate(c.route!)}>Practise this now →</Button>}
        </div>
      )}
    </article>
  );
}

const Row = ({ icon: Icon, title, children }: { icon: typeof Eye; title: string; children: ReactNode }) => (
  <div><div className="text-muted mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><Icon className="size-3.5" />{title}</div>{children}</div>
);
