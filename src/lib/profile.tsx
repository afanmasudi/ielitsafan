import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db, logStudy, type Profile } from './db';

interface Ctx { profile: Profile | null; setProfileId: (id: string | null) => void; update: (patch: Partial<Profile>) => Promise<void>; loading: boolean }
const ProfileCtx = createContext<Ctx>(null as never);

const KEY = 'activeProfile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const setProfileId = async (id: string | null) => {
    try { if (id) sessionStorage.setItem(KEY, id); else sessionStorage.removeItem(KEY); } catch { /* private mode */ }
    setProfile(id ? (await db.profiles.get(id)) ?? null : null);
  };

  useEffect(() => {
    let id: string | null = null;
    try { id = sessionStorage.getItem(KEY); } catch { /* ignore */ }
    (id ? db.profiles.get(id) : Promise.resolve(undefined)).then((p) => { setProfile(p ?? null); setLoading(false); });
  }, []);

  // Study-time tracking: count active minutes while the tab is visible and the user interacts.
  useEffect(() => {
    if (!profile) return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const evts = ['pointerdown', 'keydown', 'scroll'] as const;
    evts.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < 120_000) void logStudy(profile.id, 30);
    }, 30_000);
    return () => { clearInterval(t); evts.forEach((e) => window.removeEventListener(e, bump)); };
  }, [profile]);

  const update = async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    await db.profiles.put(next);
    setProfile(next);
  };

  return <ProfileCtx.Provider value={{ profile, setProfileId: (id) => void setProfileId(id), update, loading }}>{children}</ProfileCtx.Provider>;
}

export const useProfile = () => useContext(ProfileCtx);
/** For pages rendered only when a profile is active. */
export const useActiveProfile = () => useContext(ProfileCtx).profile!;

export const testFamily = (p: Pick<Profile, 'testType'>): 'academic' | 'general' => (p.testType === 'general' || p.testType === 'ukvi-general' ? 'general' : 'academic');

export const TEST_LABEL: Record<Profile['testType'], string> = {
  academic: 'IELTS Academic', general: 'IELTS General Training', 'ukvi-academic': 'IELTS for UKVI (Academic)', 'ukvi-general': 'IELTS for UKVI (General Training)', lifeskills: 'IELTS Life Skills',
};
