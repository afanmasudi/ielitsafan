import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { db, type Attempt } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { Badge, fmtBand } from '../components/ui';

export function useAttempts(kind?: Attempt['kind'], refresh = 0) {
  const p = useActiveProfile();
  const [rows, setRows] = useState<Attempt[]>([]);
  useEffect(() => {
    const q = kind ? db.attempts.where('[profileId+kind]').equals([p.id, kind]) : db.attempts.where('profileId').equals(p.id);
    void q.toArray().then((r) => setRows(r.sort((a, b) => b.at - a.at)));
  }, [p.id, kind, refresh]);
  return rows;
}

export function History({ kind, title }: { kind: Attempt['kind']; title: string }) {
  const [n, setN] = useState(0);
  const rows = useAttempts(kind, n);
  if (!rows.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="surface divide-y divide-[var(--border)] rounded-2xl">
        {rows.slice(0, 10).map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="grad-brand grid size-10 shrink-0 place-items-center rounded-xl font-bold text-white">{a.band !== undefined ? fmtBand(a.band) : '–'}</div>
            <div className="min-w-0 flex-1"><div className="truncate font-medium">{a.title}</div><div className="text-muted flex items-center gap-2 text-xs"><Clock className="size-3" />{new Date(a.at).toLocaleString()}{a.raw !== undefined && ` · ${a.raw}/${a.total}`}{a.mockId && <Badge>mock</Badge>}</div></div>
            <button className="text-muted rounded-lg p-2 hover:text-rose-500" aria-label="Delete attempt" onClick={async () => { await db.attempts.delete(a.id!); setN(n + 1); }}><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
