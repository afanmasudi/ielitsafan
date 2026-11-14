import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, CalendarCheck, Mic, PenLine, BookOpen, Headphones, ClipboardCheck, Layers, SpellCheck,
  Sparkles, BriefcaseBusiness, LineChart, Settings, Moon, Sun, Menu, X, LogOut, Lock, Compass,
} from 'lucide-react';
import { navigate, useRoute } from '../lib/router';
import { useProfile, TEST_LABEL } from '../lib/profile';
import { cx } from './ui';
import { Avatar } from './Avatar';

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plan', label: 'Study plan', icon: CalendarCheck },
  { to: '/guide', label: 'Band 8.5 Guide', icon: Compass },
  { to: '/speaking', label: 'Speaking Lab', icon: Mic },
  { to: '/writing', label: 'Writing Lab', icon: PenLine },
  { to: '/reading', label: 'Reading Lab', icon: BookOpen },
  { to: '/listening', label: 'Listening Lab', icon: Headphones },
  { to: '/mock', label: 'Mock Exams', icon: ClipboardCheck },
  { to: '/vocabulary', label: 'Vocabulary', icon: Layers },
  { to: '/grammar', label: 'Grammar', icon: SpellCheck },
  { to: '/tutor', label: 'AI Tutor', icon: Sparkles },
  { to: '/interview', label: 'Interview Practice', icon: BriefcaseBusiness },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/settings', label: 'Settings & Models', icon: Settings },
];
const MOBILE = ['/', '/speaking', '/writing', '/mock'];

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b0a17' : '#6d28d9');
  }, [dark]);
  return [dark, setDark] as const;
}

const isActive = (path: string, to: string) => (to === '/' ? path === '/' : path.startsWith(to));

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useRoute();
  const { profile, setProfileId } = useProfile();
  const [dark, setDark] = useTheme();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);

  const links = (onMobile = false) => NAV.map((n) => {
    const on = isActive(path, n.to);
    return (
      <a key={n.to} href={`#${n.to}`} aria-current={on ? 'page' : undefined}
        className={cx('flex items-center gap-3 rounded-[10px] px-3 py-[7px] text-[14px] transition', on ? 'bg-black/[0.06] font-semibold text-[var(--text)] dark:bg-white/[0.1]' : 'text-[var(--text)] opacity-80 hover:bg-black/[0.04] hover:opacity-100 dark:hover:bg-white/[0.06]', onMobile && 'py-3 text-[17px]')}>
        <n.icon className={cx('size-[18px] shrink-0', on ? 'text-[var(--accent)]' : 'text-muted')} strokeWidth={1.8} /> {n.label}
      </a>
    );
  });

  const profileBox = profile && (
    <div className="flex items-center gap-3 rounded-2xl p-2">
      <Avatar name={profile.name} grad={profile.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{profile.name}</div>
        <div className="text-muted truncate text-[12px]">{TEST_LABEL[profile.testType]}</div>
      </div>
      <button onClick={() => { setProfileId(null); navigate('/'); }} className="text-muted rounded-full p-2 hover:bg-black/[0.05]" title={profile.pinHash ? 'Lock and switch profile' : 'Switch profile'} aria-label="Switch profile">
        {profile.pinHash ? <Lock className="size-4" /> : <LogOut className="size-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-3 border-r border-[var(--border)] px-3 py-5 lg:flex">
        <div className="px-2 pb-2"><Brand /></div>
        <nav className="-mr-1 flex-1 space-y-0.5 overflow-y-auto pr-1">{links()}</nav>
        <button onClick={() => setDark(!dark)} className="text-muted flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] hover:bg-black/[0.04]">{dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? 'Light appearance' : 'Dark appearance'}</button>
        {profileBox}
        <p className="text-muted px-3 text-[11px]">Made by Afan Abdullah Masoodi</p>
      </aside>

      <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--border)] px-4 lg:hidden">
        <Brand small />
        <div className="flex items-center">
          <button onClick={() => setDark(!dark)} className="rounded-full p-2.5" aria-label="Toggle dark mode">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>
          <button onClick={() => setMenu(true)} className="rounded-full p-2.5" aria-label="Open menu"><Menu className="size-[18px]" /></button>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMenu(false)}>
          <div className="glass absolute inset-0 flex flex-col gap-3 overflow-y-auto p-5 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><Brand small /><button onClick={() => setMenu(false)} className="surface-2 grid size-9 place-items-center rounded-full" aria-label="Close menu"><X className="size-5" /></button></div>
            <nav className="space-y-0.5">{links(true)}</nav>
            {profileBox}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1100px] px-5 pb-28 pt-8 sm:px-8 lg:pb-16 lg:pt-12">{children}</main>

      <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] lg:hidden" aria-label="Main">
        {NAV.filter((n) => MOBILE.includes(n.to)).map((n) => (
          <a key={n.to} href={`#${n.to}`} className={cx('flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium', isActive(path, n.to) ? 'text-[var(--accent)]' : 'text-muted')}>
            <n.icon className="size-[22px]" strokeWidth={1.8} /> {n.label.split(' ')[0]}
          </a>
        ))}
        <button onClick={() => setMenu(true)} className="text-muted flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium"><Menu className="size-[22px]" strokeWidth={1.8} /> More</button>
      </nav>
    </div>
  );
}

export function Brand({ small }: { small?: boolean }) {
  return (
    <a href="#/" className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className={small ? 'size-7' : 'size-8'} />
      <div className="leading-tight">
        <div className={cx('font-semibold tracking-[-0.02em]', small ? 'text-[17px]' : 'text-[19px]')}>IELTS Studio</div>
        {!small && <div className="text-muted text-[11px]">Private. On your device.</div>}
      </div>
    </a>
  );
}
