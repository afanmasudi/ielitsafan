import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus, Lock, ShieldCheck, Trash2, Moon, Sun } from 'lucide-react';
import { db, type Profile } from '../lib/db';
import { useProfile } from '../lib/profile';
import { checkPin, deleteProfile, hashPin, importData } from '../lib/backup';
import { Avatar, AVATARS } from '../components/Avatar';
import { Button, Confirm, Field, inputCls, Modal, More, Notice } from '../components/ui';
import { Brand, useTheme } from '../components/Layout';
import { navigate } from '../lib/router';

export function Welcome() {
  const { setProfileId } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [creating, setCreating] = useState(false);
  const [unlock, setUnlock] = useState<Profile | null>(null);
  const [msg, setMsg] = useState('');
  const [toDelete, setToDelete] = useState<Profile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useTheme();

  const load = () => db.profiles.toArray().then((ps) => setProfiles(ps.sort((a, b) => a.createdAt - b.createdAt)));
  useEffect(() => { void load(); }, []);

  const open = (p: Profile) => (p.pinHash ? setUnlock(p) : (setProfileId(p.id), navigate('/')));

  const onImport = async (f: File) => {
    try { const n = await importData(JSON.parse(await f.text())); setMsg(`Imported ${n} profile(s).`); await load(); }
    catch (e) { setMsg((e as Error).message); }
  };

  const profilesRef = useRef<HTMLDivElement>(null);
  const toProfiles = () => profilesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const Img = ({ name, className = '' }: { name: string; className?: string }) => (
    <img src={`/images/${name}-1600.webp`} srcSet={`/images/${name}-800.webp 800w, /images/${name}-1600.webp 1600w`} sizes="(max-width: 900px) 100vw, 1000px" alt="" className={`photo h-full w-full ${className}`} />
  );

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-b border-[var(--border)]">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-5">
          <Brand small />
          <div className="flex items-center gap-1">
            <button className="rounded-full p-2" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>
            <Button size="sm" onClick={toProfiles}>{profiles.length ? 'Sign in' : 'Get started'}</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pb-10 pt-16 text-center sm:pt-24">
        <p className="animate-fade-up text-[17px] font-semibold text-[#ff6a00] sm:text-[21px]">Academic · General Training · UKVI · Life Skills</p>
        <h1 className="mx-auto mt-2 max-w-4xl animate-fade-up text-[44px] sm:text-[80px]">IELTS. <span className="grad-text">Mastered privately.</span></h1>
        <p className="text-muted mx-auto mt-4 max-w-2xl animate-fade-up text-[19px] sm:text-[24px] sm:leading-snug">Mock tests, a live voice examiner, writing feedback and a plan built around you. Everything runs on your device.</p>
        <div className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={() => (profiles.length ? toProfiles() : setCreating(true))}>{profiles.length ? 'Continue studying' : 'Start for free'}</Button>
          <More onClick={() => fileRef.current?.click()}>Restore a backup</More>
        </div>
      </section>
      <div className="mx-auto max-w-[1100px] px-5">
        <div className="tile aspect-[16/8] overflow-hidden rounded-[28px] bg-black/5 animate-fade-up"><Img name="study" /></div>
      </div>

      {/* Feature tiles */}
      <section className="mx-auto mt-20 max-w-[1100px] px-5">
        <h2 className="text-center text-[32px] sm:text-[48px]">Everything you need for 8.5+.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Tile eyebrow="Speaking" title="Talk to an examiner. As if it were real." text="A live video-call examiner listens, waits, follows up and can be interrupted." color="#ff6a00"><Img name="group" /></Tile>
          <Tile eyebrow="Listening" title="Four parts. Forty questions." text="Original recordings voiced in British and American English." color="#0a8ff0"><Img name="listening" /></Tile>
          <Tile eyebrow="Writing" title="Feedback on every criterion." text="Band estimates with reasons, corrections and model answers." color="#9b45e6"><Img name="laptop" /></Tile>
          <Tile eyebrow="Reading" title="Every question type. Explained." text="Highlight, answer, then see the exact line that proves it." color="#28b463"><Img name="study" className="object-[50%_20%]" /></Tile>
        </div>
      </section>

      {/* Profiles */}
      <section className="mx-auto my-24 max-w-[640px] px-5" ref={profilesRef}>
        <div className="surface rounded-[28px] p-8 text-center">
          <h2 className="text-[28px] sm:text-[32px]">{profiles.length ? 'Who’s studying?' : 'Create your profile.'}</h2>
          <p className="text-muted mt-1 text-[15px]">Stored only in this browser. No account needed.</p>
          <div className="mt-6 space-y-2 text-left">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <button onClick={() => open(p)} className="surface-2 flex flex-1 items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]">
                  <Avatar name={p.name} grad={p.avatar} />
                  <div className="flex-1"><div className="font-semibold">{p.name}</div><div className="text-muted text-[13px]">{p.onboarded ? `Target ${p.testType === 'lifeskills' ? 'Pass' : p.target.toFixed(1)}` : 'Setup not finished'}</div></div>
                  {p.pinHash && <Lock className="text-muted size-4" />}
                </button>
                <button className="text-muted rounded-full p-2 hover:text-[#ff3b30]" aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p)}><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full" icon={Plus} size="lg" onClick={() => setCreating(true)}>New profile</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          {msg && <Notice className="mt-3">{msg}</Notice>}
          <p className="text-muted mt-6 flex items-start justify-center gap-2 text-left text-[12px]"><ShieldCheck className="size-4 shrink-0 text-[#34c759]" />Essays, recordings and CVs never leave this device. Profiles don’t sync between devices, and a PIN only keeps casual users out. Export backups from Settings.</p>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-6 text-center text-[12px] text-muted"><p className="mb-1 text-[13px] font-medium text-[var(--text)]">Made by Afan Abdullah Masoodi</p>IELTS Studio is an independent practice tool, not affiliated with the British Council, IDP or Cambridge. Photos: public domain (CC0) via Wikimedia Commons.</footer>

      <CreateProfile open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setProfileId(id); navigate('/'); }} />
      <Confirm open={!!toDelete} title="Delete profile?" message={`This permanently deletes "${toDelete?.name}" and all of its progress from this browser. Export a backup first if you might need it.`} onClose={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await deleteProfile(toDelete.id); await load(); } }} />
      <UnlockModal profile={unlock} onClose={() => setUnlock(null)} onOk={(p) => { setProfileId(p.id); navigate('/'); }} />
    </div>
  );
}

function Tile({ eyebrow, title, text, color, children }: { eyebrow: string; title: string; text: string; color: string; children: ReactNode }) {
  return (
    <div className="surface tile flex flex-col overflow-hidden rounded-[28px]">
      <div className="px-8 pb-6 pt-9 text-center">
        <p className="text-[15px] font-semibold" style={{ color }}>{eyebrow}</p>
        <h3 className="mt-1 text-[24px] leading-tight sm:text-[28px]">{title}</h3>
        <p className="text-muted mx-auto mt-2 max-w-sm text-[15px]">{text}</p>
      </div>
      <div className="relative min-h-56 flex-1 overflow-hidden"><div className="absolute inset-0">{children}</div></div>
    </div>
  );
}

function CreateProfile({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const create = async () => {
    const id = crypto.randomUUID();
    const lock = pin ? await hashPin(pin) : null;
    await db.profiles.add({ id, name: name.trim(), avatar, createdAt: Date.now(), onboarded: false, testType: 'academic', currentLevel: 'B1', target: 6.5, dailyMinutes: 45, strongSkills: [], weakSkills: [], ...(lock ? { pinHash: lock.hash, pinSalt: lock.salt } : {}) });
    try { await navigator.storage?.persist?.(); } catch { /* optional */ }
    setName(''); setPin('');
    onCreated(id);
  };
  return (
    <Modal open={open} onClose={onClose} title="New study profile">
      <div className="space-y-4">
        <Field label="Your name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aisha" autoFocus maxLength={40} /></Field>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Colour</span>
          <div className="flex gap-2">{AVATARS.map((a) => <button key={a} onClick={() => setAvatar(a)} aria-label={a} className={`${a} size-9 rounded-full ${avatar === a ? 'ring-4 ring-[var(--accent)]/40' : ''}`} />)}</div>
        </div>
        <Field label="Optional PIN" hint="Stops casual access on a shared computer. It is not encryption, and cannot be recovered if forgotten."><input className={inputCls} inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="4–8 digits" /></Field>
        <Button className="w-full" disabled={!name.trim() || (pin.length > 0 && pin.length < 4)} onClick={create}>Create profile</Button>
      </div>
    </Modal>
  );
}

function UnlockModal({ profile, onClose, onOk }: { profile: Profile | null; onClose: () => void; onOk: (p: Profile) => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  if (!profile) return null;
  const go = async () => { if (await checkPin(profile, pin)) { setPin(''); setErr(''); onOk(profile); } else setErr('Incorrect PIN.'); };
  return (
    <Modal open onClose={onClose} title={`Unlock ${profile.name}`}>
      <form onSubmit={(e) => { e.preventDefault(); void go(); }} className="space-y-3">
        <input className={inputCls} type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" />
        {err && <p className="text-sm text-rose-500">{err}</p>}
        <Button className="w-full" type="submit">Unlock</Button>
      </form>
    </Modal>
  );
}
