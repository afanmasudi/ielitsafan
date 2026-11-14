import { db, PROFILE_TABLES, type Profile } from './db';

export const BACKUP_FORMAT = 'ielts-studio-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  profiles: Profile[];
  tables: Record<string, unknown[]>;
}

export function validateBackup(x: unknown): x is Backup {
  const b = x as Backup;
  return !!b && b.format === BACKUP_FORMAT && typeof b.version === 'number' && b.version <= BACKUP_VERSION
    && Array.isArray(b.profiles) && b.profiles.every((p) => typeof p.id === 'string' && typeof p.name === 'string')
    && typeof b.tables === 'object' && b.tables !== null;
}

export async function exportData(profileId?: string): Promise<Backup> {
  const profiles = profileId ? [await db.profiles.get(profileId)].filter(Boolean) as Profile[] : await db.profiles.toArray();
  const ids = new Set(profiles.map((p) => p.id));
  const tables: Record<string, unknown[]> = {};
  for (const t of PROFILE_TABLES) {
    const rows = (await db.table(t).toArray()) as { profileId: string }[];
    tables[t] = rows.filter((r) => ids.has(r.profileId));
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), profiles, tables };
}

export function downloadJson(data: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Imports profiles; existing profiles with the same id are replaced. */
export async function importData(raw: unknown): Promise<number> {
  if (!validateBackup(raw)) throw new Error('This file is not an IELTS Studio backup.');
  const ids = raw.profiles.map((p) => p.id);
  await db.transaction('rw', [db.profiles, ...PROFILE_TABLES.map((t) => db.table(t))], async () => {
    for (const id of ids) await deleteProfileRows(id);
    await db.profiles.bulkPut(raw.profiles);
    for (const t of PROFILE_TABLES) {
      const rows = (raw.tables[t] ?? []) as Record<string, unknown>[];
      const valid = rows.filter((r) => ids.includes(r.profileId as string));
      // Drop auto-increment ids so imported rows never collide with existing ones.
      const clean = valid.map((r) => { if (!['attempts', 'vocab', 'notes', 'mistakes'].includes(t)) return r; const copy = { ...r }; delete copy.id; return copy; });
      if (clean.length) await db.table(t).bulkPut(clean);
    }
  });
  return ids.length;
}

async function deleteProfileRows(profileId: string) {
  for (const t of PROFILE_TABLES) await db.table(t).where('profileId').equals(profileId).delete();
}

export async function deleteProfile(profileId: string) {
  await db.transaction('rw', [db.profiles, ...PROFILE_TABLES.map((t) => db.table(t))], async () => {
    await deleteProfileRows(profileId);
    await db.profiles.delete(profileId);
  });
}

export async function deleteEverything() {
  await db.delete();
  localStorage.clear();
  if ('caches' in window) for (const k of await caches.keys()) if (!k.startsWith('ielts-studio-shell')) await caches.delete(k);
}

// ---- Local PIN (convenience lock, not real security)
const enc = new TextEncoder();
export async function hashPin(pin: string, salt?: string) {
  const s = salt ?? crypto.getRandomValues(new Uint8Array(16)).reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(s), iterations: 150_000, hash: 'SHA-256' }, key, 256);
  return { salt: s, hash: [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('') };
}
export async function checkPin(p: Profile, pin: string) {
  if (!p.pinHash || !p.pinSalt) return true;
  return (await hashPin(pin, p.pinSalt)).hash === p.pinHash;
}
