import { useState } from 'react';
import { PenLine, ArrowLeft, BarChart3, Mail, FileText } from 'lucide-react';
import { WRITING_PROMPTS, type WritingPrompt } from '../content/writing';
import { WritingTask } from '../features/WritingTask';
import { testFamily, useActiveProfile } from '../lib/profile';
import { Badge, Button, Card, PageHeader, Tabs } from '../components/ui';
import { History } from './shared';

export default function Writing() {
  const p = useActiveProfile();
  const [test, setTest] = useState<'academic' | 'general'>(testFamily(p));
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  if (prompt) return <><Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setPrompt(null)}>All tasks</Button><WritingTask key={prompt.id} prompt={prompt} /></>;
  const t1 = WRITING_PROMPTS.filter((w) => w.task === 1 && w.test === test);
  const t2 = WRITING_PROMPTS.filter((w) => w.task === 2);
  const item = (w: WritingPrompt) => (
    <Card key={w.id} onClick={() => setPrompt(w)}>
      <div className="flex items-center gap-2">{w.task === 1 ? (w.kind === 'general-task1' ? <Mail className="size-4 text-[var(--accent)]" /> : <BarChart3 className="size-4 text-[var(--accent)]" />) : <FileText className="size-4 text-[var(--accent)]" />}<Badge>{w.chart?.type ?? w.tone ?? w.essayType}</Badge></div>
      <h3 className="mt-2 font-semibold">{w.title}</h3>
      <p className="text-muted mt-1 line-clamp-2 text-sm">{w.prompt}</p>
    </Card>
  );
  return (
    <div>
      <PageHeader image="laptop" title="Writing Lab" subtitle="Timed tasks, autosave, criterion-by-criterion feedback and model answers." icon={PenLine} grad="grad-writing"
        actions={<Tabs value={test} onChange={setTest} options={[{ value: 'academic', label: 'Academic' }, { value: 'general', label: 'General Training' }]} />} />
      <h2 className="mb-3 text-lg font-semibold">Task 1 · {test === 'academic' ? 'describe visual information' : 'write a letter'}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{t1.map(item)}</div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Task 2 · essay (counts double)</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{t2.map(item)}</div>
      <History kind="writing" title="Writing history" />
    </div>
  );
}
