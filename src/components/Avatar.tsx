import { cx } from './ui';

export const AVATARS = ['grad-brand', 'grad-speaking', 'grad-reading', 'grad-listening', 'grad-writing', 'grad-gold'];

export function Avatar({ name, grad, size = 'md' }: { name: string; grad: string; size?: 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return <div className={cx(grad, 'grid shrink-0 place-items-center rounded-full font-semibold text-white', size === 'lg' ? 'size-16 text-xl' : 'size-10 text-sm')}>{initials}</div>;
}
