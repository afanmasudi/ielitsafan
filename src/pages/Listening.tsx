import { useState } from 'react';
import { Headphones, ArrowLeft, Timer } from 'lucide-react';
import { LISTENING, type ListeningPart } from '../content/listening';
import { TYPE_LABEL } from '../lib/marking';
import { ListeningTest } from '../features/ListeningTest';
import { ModelStatus } from '../components/ModelStatus';
import { Badge, Button, Card, PageHeader } from '../components/ui';
import { History } from './shared';

export default function Listening() {
  const [run, setRun] = useState<{ parts: ListeningPart[]; exam: boolean; key: number } | null>(null);
  if (run) return <><Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setRun(null)}>Listening Lab</Button><ListeningTest key={run.key} parts={run.parts} exam={run.exam} /></>;
  return (
    <div>
      <PageHeader image="listening" title="Listening Lab" subtitle="Original recordings voiced on your device, with British and American speakers." icon={Headphones} grad="grad-listening" actions={<ModelStatus show={['tts']} />} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="grad-listening !border-0 text-white" onClick={() => setRun({ parts: LISTENING, exam: true, key: Date.now() })}>
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Timer className="size-4" />About 30 minutes · 40 questions</div>
          <h3 className="mt-1 text-xl font-bold">Full test (exam mode)</h3>
          <p className="mt-1 text-sm opacity-90">Each recording plays once. Transcripts are shown after you submit.</p>
        </Card>
        <Card onClick={() => setRun({ parts: LISTENING, exam: false, key: Date.now() })}>
          <h3 className="text-lg font-semibold">Full test (practice mode)</h3>
          <p className="text-muted mt-1 text-sm">Pause, replay, change speed and read the transcript.</p>
        </Card>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Practise one part</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {LISTENING.map((p) => (
          <Card key={p.id} onClick={() => setRun({ parts: [p], exam: false, key: Date.now() })}>
            <Badge tone="info">Part {p.part}</Badge>
            <h3 className="mt-2 font-semibold">{p.title}</h3>
            <p className="text-muted mt-1 text-sm">{p.context}</p>
            <div className="mt-2 flex flex-wrap gap-1">{[...new Set(p.groups.map((g) => g.type))].map((t) => <Badge key={t}>{TYPE_LABEL[t]}</Badge>)}</div>
          </Card>
        ))}
      </div>
      <History kind="listening" title="Listening history" />
    </div>
  );
}
