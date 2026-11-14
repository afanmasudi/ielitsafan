import { useState } from 'react';
import { BookOpen, ArrowLeft, Timer, Sparkles } from 'lucide-react';
import { PASSAGES, readingTest } from '../content/reading';
import type { Passage } from '../content/types';
import { TYPE_LABEL } from '../lib/marking';
import { ReadingTest } from '../features/ReadingTest';
import { testFamily, useActiveProfile } from '../lib/profile';
import { Badge, Button, Card, PageHeader, Tabs } from '../components/ui';
import { History, useAttempts } from './shared';
import { masteryByType, weakestFirst } from '../lib/insights';

export default function Reading() {
  const p = useActiveProfile();
  const [test, setTest] = useState<'academic' | 'general'>(testFamily(p));
  const [run, setRun] = useState<{ passages: Passage[]; minutes: number; key: number } | null>(null);
  const attempts = useAttempts();
  if (run) return <><Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setRun(null)}>Reading Lab</Button><ReadingTest key={run.key} passages={run.passages} minutes={run.minutes} /></>;
  const mastery = masteryByType(attempts);
  const list = PASSAGES.filter((x) => x.test === test);
  const recommended = mastery.length ? weakestFirst(list.map((x) => ({ ...x, types: x.groups.map((g) => g.type) })), mastery)[0] : null;
  return (
    <div>
      <PageHeader image="study" title="Reading Lab" subtitle="Original passages with verified answer keys, highlighting and explained answers." icon={BookOpen} grad="grad-reading"
        actions={<Tabs value={test} onChange={setTest} options={[{ value: 'academic', label: 'Academic' }, { value: 'general', label: 'General Training' }]} />} />
      <Card className="grad-reading mb-6 !border-0 text-white" onClick={() => setRun({ passages: readingTest(test), minutes: 60, key: Date.now() })}>
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Timer className="size-4" />60 minutes · 40 questions</div>
        <h3 className="mt-1 text-xl font-bold">Full {test === 'academic' ? 'Academic' : 'General Training'} Reading test</h3>
        <p className="mt-1 text-sm opacity-90">Timed, with a question navigator and a band estimate from the {test === 'academic' ? 'Academic' : 'General Training'} conversion table.</p>
      </Card>
      {recommended && <Card className="mb-6 ring-2 ring-[var(--accent)]/40" onClick={() => setRun({ passages: [recommended], minutes: recommended.minutes, key: Date.now() })}><div className="flex items-center gap-2 text-sm font-semibold text-[var(--link)]"><Sparkles className="size-4" />Recommended for you</div><h3 className="mt-1 font-semibold">{recommended.title}</h3><p className="text-muted text-sm">Chosen because it practises your weakest question types: {[...new Set(recommended.groups.map((g) => TYPE_LABEL[g.type]))].join(', ')}.</p></Card>}
      <h2 className="mb-3 text-lg font-semibold">Practise one {test === 'general' ? 'text' : 'passage'}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((x) => (
          <Card key={x.id} onClick={() => setRun({ passages: [x], minutes: x.minutes, key: Date.now() })}>
            <Badge tone="good">Section {x.section} · {x.minutes} min</Badge>
            <h3 className="mt-2 font-semibold">{x.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1">{[...new Set(x.groups.map((g) => g.type))].map((t) => <Badge key={t}>{TYPE_LABEL[t]}</Badge>)}</div>
          </Card>
        ))}
      </div>
      <History kind="reading" title="Reading history" />
    </div>
  );
}
