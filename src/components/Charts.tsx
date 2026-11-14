import type { ChartSpec } from '../content/writing';

export const PALETTE = ['#0071e3', '#ff9f0a', '#34c759', '#af52de', '#ff375f', '#5ac8fa'];

/** Renders the Writing Task 1 visual from data (no images, so it is crisp and accessible). */
export function TaskChart({ spec }: { spec: ChartSpec }) {
  switch (spec.type) {
    case 'line': case 'bar': return <XYChart spec={spec} />;
    case 'pie': return <PieCharts spec={spec} />;
    case 'table': return <DataTable head={spec.head} rows={spec.rows} title={spec.title} />;
    case 'process': return <ProcessChart spec={spec} />;
    case 'map': return <MapChart spec={spec} />;
    case 'mixed': return <div className="space-y-4">{spec.parts.map((p, i) => <TaskChart key={i} spec={p} />)}</div>;
  }
}

function Legend({ items }: { items: string[] }) {
  return <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">{items.map((s, i) => <span key={s} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />{s}</span>)}</div>;
}

function XYChart({ spec }: { spec: Extract<ChartSpec, { type: 'line' | 'bar' }> }) {
  const W = 520, H = 260, L = 44, B = 32, T = 12, R = 12;
  const max = Math.ceil(Math.max(...spec.series.flatMap((s) => s.values)) / 10) * 10 || 10;
  const x = (i: number) => L + ((W - L - R) * (spec.type === 'line' ? i / Math.max(1, spec.categories.length - 1) : (i + 0.5) / spec.categories.length));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const groupW = (W - L - R) / spec.categories.length;
  const barW = (groupW * 0.75) / spec.series.length;
  return (
    <figure>
      <figcaption className="mb-2 text-center text-sm font-semibold">{spec.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={spec.title}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" opacity={0.12} /><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity={0.6}>{spec.unit === '£' ? `£${t}` : `${t}${spec.unit}`}</text></g>)}
        {spec.categories.map((c, i) => <text key={c} x={spec.type === 'line' ? x(i) : L + groupW * (i + 0.5)} y={H - 10} textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>{c}</text>)}
        {spec.type === 'line'
          ? spec.series.map((s, si) => (
            <g key={s.name}>
              <polyline fill="none" stroke={PALETTE[si]} strokeWidth={2.5} strokeLinejoin="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
              {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={PALETTE[si]}><title>{`${s.name}, ${spec.categories[i]}: ${v}${spec.unit}`}</title></circle>)}
            </g>
          ))
          : spec.series.map((s, si) => s.values.map((v, i) => (
            <rect key={`${si}-${i}`} x={L + groupW * i + groupW * 0.125 + barW * si} y={y(v)} width={barW - 2} height={y(0) - y(v)} rx={3} fill={PALETTE[si]}><title>{`${s.name}, ${spec.categories[i]}: ${spec.unit === '£' ? '£' + v : v + spec.unit}`}</title></rect>
          )))}
      </svg>
      <Legend items={spec.series.map((s) => s.name)} />
    </figure>
  );
}

function PieCharts({ spec }: { spec: Extract<ChartSpec, { type: 'pie' }> }) {
  const labels = spec.charts[0].slices.map((s) => s.label);
  return (
    <figure>
      <figcaption className="mb-2 text-center text-sm font-semibold">{spec.title}</figcaption>
      <div className="grid grid-cols-2 gap-4">
        {spec.charts.map((c) => {
          const total = c.slices.reduce((s, x) => s + x.value, 0);
          let a0 = -Math.PI / 2;
          return (
            <div key={c.name} className="text-center">
              <svg viewBox="-110 -110 220 220" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`${c.name} pie chart`}>
                {c.slices.map((s) => {
                  const a1 = a0 + (s.value / total) * Math.PI * 2;
                  const large = a1 - a0 > Math.PI ? 1 : 0;
                  const path = `M0 0 L${100 * Math.cos(a0)} ${100 * Math.sin(a0)} A100 100 0 ${large} 1 ${100 * Math.cos(a1)} ${100 * Math.sin(a1)} Z`;
                  const mid = (a0 + a1) / 2;
                  a0 = a1;
                  return <g key={s.label}><path d={path} fill={PALETTE[labels.indexOf(s.label) % PALETTE.length]} stroke="var(--surface)" strokeWidth={2}><title>{`${s.label}: ${s.value}%`}</title></path>{s.value >= 6 && <text x={66 * Math.cos(mid)} y={66 * Math.sin(mid) + 4} textAnchor="middle" fontSize="13" fontWeight={600} fill="#fff">{s.value}%</text>}</g>;
                })}
              </svg>
              <div className="mt-1 text-sm font-medium">{c.name}</div>
            </div>
          );
        })}
      </div>
      <Legend items={labels} />
    </figure>
  );
}

export function DataTable({ head, rows, title }: { head: string[]; rows: (string | number)[][]; title?: string }) {
  return (
    <figure>
      {title && <figcaption className="mb-2 text-center text-sm font-semibold">{title}</figcaption>}
      <div className="overflow-x-auto rounded-xl border border-soft">
        <table className="w-full text-sm">
          <thead className="surface-2"><tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-soft">{r.map((c, j) => <td key={j} className="px-3 py-2">{typeof c === 'number' ? c.toLocaleString() : c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}

function ProcessChart({ spec }: { spec: Extract<ChartSpec, { type: 'process' }> }) {
  return (
    <figure>
      <figcaption className="mb-3 text-center text-sm font-semibold">{spec.title}</figcaption>
      <ol className="grid gap-2 sm:grid-cols-2">
        {spec.steps.map((s, i) => (
          <li key={i} className="surface-2 flex items-center gap-3 rounded-xl p-3 text-sm">
            <span className="grad-brand grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{i + 1}</span>{s}
          </li>
        ))}
      </ol>
    </figure>
  );
}

const MAP_FILL: Record<string, string> = { building: '#a78bfa', green: '#34d399', water: '#38bdf8', road: '#94a3b8', parking: '#fbbf24' };

function MapChart({ spec }: { spec: Extract<ChartSpec, { type: 'map' }> }) {
  return (
    <figure>
      <figcaption className="mb-2 text-center text-sm font-semibold">{spec.title}</figcaption>
      <div className="grid gap-4 sm:grid-cols-2">
        {spec.panels.map((p) => (
          <div key={p.name}>
            <svg viewBox="-2 -2 104 104" className="w-full rounded-xl border border-soft" role="img" aria-label={`Map ${p.name}`}>
              {p.features.map((f) => (
                <g key={f.label}>
                  <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={1.5} fill={MAP_FILL[f.kind]} opacity={0.8} />
                  <text x={f.x + f.w / 2} y={f.y + f.h / 2 + 1.5} textAnchor="middle" fontSize={f.kind === 'road' ? 3 : 4} fontWeight={600} fill="#111827" transform={f.kind === 'road' ? `rotate(-90 ${f.x + f.w / 2} ${f.y + f.h / 2})` : undefined}>{f.label}</text>
                </g>
              ))}
              <text x={50} y={99} textAnchor="middle" fontSize={3.5} fill="currentColor">N ↑</text>
            </svg>
            <div className="mt-1 text-center text-sm font-medium">{p.name}</div>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Line chart for progress over time. */
export function TrendChart({ series, max = 9, height = 180 }: { series: { name: string; points: { label: string; value: number }[] }[]; max?: number; height?: number }) {
  const W = 560, H = height, L = 30, B = 26, T = 10, R = 10;
  const n = Math.max(...series.map((s) => s.points.length), 2);
  const x = (i: number) => L + ((W - L - R) * i) / (n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = max === 9 ? [0, 3, 5, 7, 9] : [0, max / 2, max];
  const labels = series.find((s) => s.points.length === n)?.points.map((p) => p.label) ?? [];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Progress chart">
        <defs>{series.map((_, i) => <linearGradient key={i} id={`tg${i}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={PALETTE[i]} stopOpacity={0.25} /><stop offset="1" stopColor={PALETTE[i]} stopOpacity={0} /></linearGradient>)}</defs>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" opacity={0.1} /><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity={0.55}>{t}</text></g>)}
        {labels.map((l, i) => (n <= 10 || i % Math.ceil(n / 8) === 0) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.6}>{l}</text>)}
        {series.map((s, si) => s.points.length > 0 && (
          <g key={s.name}>
            {si === 0 && s.points.length > 1 && <polygon fill={`url(#tg${si})`} points={`${x(0)},${y(0)} ${s.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} ${x(s.points.length - 1)},${y(0)}`} />}
            <polyline fill="none" stroke={PALETTE[si]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" points={s.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} />
            {s.points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={3.5} fill={PALETTE[si]}><title>{`${s.name} ${p.label}: ${p.value}`}</title></circle>)}
          </g>
        ))}
      </svg>
      {series.length > 1 && <Legend items={series.map((s) => s.name)} />}
    </div>
  );
}

/** Simple vertical bars (e.g. minutes per day). */
export function Bars({ data, unit = '', height = 140 }: { data: { label: string; value: number }[]; unit?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.value}${unit}`}>
          <div className="grad-brand w-full rounded-t-md transition-all" style={{ height: `${Math.max(3, (d.value / max) * (height - 22))}px`, opacity: d.value ? 1 : 0.2 }} />
          <span className="text-muted text-[10px]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Circular band display. */
export function BandRing({ band, max = 9, label, size = 120, grad = ['#0071e3', '#5e5ce6'] }: { band: number | null; max?: number; label?: string; size?: number; grad?: [string, string] }) {
  const r = 44, c = 2 * Math.PI * r;
  const v = band === null ? 0 : band / max;
  const id = `br${label?.replace(/\W/g, '') ?? ''}${size}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs><linearGradient id={id}><stop offset="0" stopColor={grad[0]} /><stop offset="1" stopColor={grad[1]} /></linearGradient></defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={8} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${id})`} strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="text-center">
        <div className="font-[family-name:var(--font-display)] font-extrabold" style={{ fontSize: size / 3.6 }}>{band === null ? '–' : band.toFixed(1)}</div>
        {label && <div className="text-muted -mt-1 text-[11px]">{label}</div>}
      </div>
    </div>
  );
}
