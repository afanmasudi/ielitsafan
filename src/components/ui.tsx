import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
  secondary: 'bg-[#e8e8ed] text-[var(--text)] hover:bg-[#dedee3] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c]',
  ghost: 'text-[var(--link)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
  danger: 'bg-[#ff3b30] text-white hover:bg-[#ff453a]',
  soft: 'bg-[var(--accent)]/10 text-[var(--link)] hover:bg-[var(--accent)]/15',
};

/** Pill button. */
export function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-normal tracking-[-0.01em] transition-colors duration-200 active:opacity-80 disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 px-3.5 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[17px]' : 'h-10 px-5 text-[15px]',
        VARIANTS[variant], className,
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}

/** Text link with chevron, e.g. "Learn more ›". */
export function More({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = 'link inline-flex items-center gap-0.5 text-[15px] hover:underline';
  return href ? <a href={href} className={cls}>{children}<span aria-hidden> ›</span></a> : <button onClick={onClick} className={cls}>{children}<span aria-hidden> ›</span></button>;
}

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return <Tag onClick={onClick} className={cx('surface tile animate-fade-up rounded-[22px] p-6 text-left', onClick && 'w-full transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]', className)}>{children}</Tag>;
}

/** Page header: small coloured eyebrow, large headline, quiet subtitle, optional wide photo. */
export function PageHeader({ title, subtitle, icon: Icon, grad = 'grad-brand', actions, image, eyebrow }: { title: string; subtitle?: string; icon?: LucideIcon; grad?: string; actions?: ReactNode; image?: string; eyebrow?: string }) {
  return (
    <header className="mb-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {(Icon || eyebrow) && (
            <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
              {Icon && <span className={cx(grad, 'grid size-7 place-items-center rounded-lg text-white')}><Icon className="size-4" /></span>}
              <span className="text-muted">{eyebrow ?? title}</span>
            </div>
          )}
          <h1 className="text-[34px] sm:text-[48px]">{title}</h1>
          {subtitle && <p className="text-muted mt-2 max-w-2xl text-[17px] leading-snug sm:text-[19px]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {image && (
        <div className="tile mt-6 overflow-hidden rounded-[22px] bg-black/5">
          <img src={`/images/${image}-1600.webp`} srcSet={`/images/${image}-800.webp 800w, /images/${image}-1600.webp 1600w`} sizes="(max-width: 1100px) 100vw, 1100px" alt="" className="photo h-44 w-full sm:h-64" loading="lazy" />
        </div>
      )}
    </header>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'brand' | 'info'; className?: string }) {
  const t = { neutral: 'surface-2 text-muted', good: 'bg-[#34c759]/12 text-[#248a3d] dark:text-[#30d158]', warn: 'bg-[#ff9f0a]/14 text-[#c93400] dark:text-[#ffb340]', bad: 'bg-[#ff3b30]/12 text-[#d70015] dark:text-[#ff6961]', brand: 'bg-[var(--accent)]/10 text-[var(--link)]', info: 'bg-[#5ac8fa]/14 text-[#0071a4] dark:text-[#64d2ff]' }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium', t, className)}>{children}</span>;
}

export function Progress({ value, className, grad = 'bg-[var(--accent)]' }: { value: number; className?: string; grad?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.12]', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-700', grad)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-md sm:place-items-center sm:p-4" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className={cx('surface max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] p-7 shadow-2xl animate-fade-up sm:rounded-[28px]', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-[21px]">{title}</h2>
          <button onClick={onClose} className="surface-2 grid size-8 place-items-center rounded-full" aria-label="Close"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Segmented control. */
export function Tabs<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cx('no-scrollbar inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-black/[0.06] p-[3px] dark:bg-white/[0.1]', className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition', value === o.value ? 'bg-[var(--surface)] text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#636366]' : 'text-muted hover:text-[var(--text)]')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center rounded-[22px] px-6 py-14 text-center">
      <Icon className="text-muted mb-4 size-10" strokeWidth={1.5} />
      <h3 className="text-[21px]">{title}</h3>
      <p className="text-muted mt-1 max-w-sm text-[15px]">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-muted mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-muted mt-1 block text-xs">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[17px] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 sm:text-[15px]';

export function Stat({ label, value, sub, grad, icon: Icon }: { label: string; value: ReactNode; sub?: string; grad?: string; icon?: LucideIcon }) {
  return (
    <div className="surface min-w-0 rounded-[22px] p-4 sm:p-5">
      <div className="text-muted flex min-w-0 items-center gap-1.5 text-[12px] font-medium sm:text-[13px]">{Icon && <Icon className={cx('size-4 shrink-0', grad ? 'text-[var(--accent)]' : '')} />}<span className="truncate">{label}</span></div>
      <div className="mt-1 truncate text-[24px] font-semibold tracking-tight sm:text-[28px]">{value}</div>
      {sub && <div className="text-muted truncate text-[12px]">{sub}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'warn' | 'good'; children: ReactNode; className?: string }) {
  const t = { info: 'bg-[var(--accent)]/[0.06]', warn: 'bg-[#ff9f0a]/10', good: 'bg-[#34c759]/10' }[tone];
  return <div className={cx('rounded-2xl px-4 py-3 text-[14px] leading-relaxed', t, className)}>{children}</div>;
}

export const fmtBand = (b: number | null | undefined) => (b === null || b === undefined ? '–' : b.toFixed(1));

/** Asks for confirmation in-page (no blocking browser dialogs). */
export function Confirm({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void | Promise<void>; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted text-[15px]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={/delete/i.test(confirmLabel) ? 'danger' : 'primary'} onClick={async () => { await onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
