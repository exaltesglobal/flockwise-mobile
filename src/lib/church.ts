// The church this app signs in to. One Flockwise server hosts many churches; members pick
// theirs by its address (the slug in app.flockwise.church/c/<slug>). With none picked, the
// server's own church is used, which keeps single-church servers working unchanged.
import { storage } from './storage';

export type ChosenChurch = { slug: string; name: string; city?: string | null };

const KEY = 'fw.church';
let current: ChosenChurch | null = null;
const listeners = new Set<() => void>();

export async function loadChurch() {
  try {
    const raw = await storage.get(KEY);
    current = raw ? (JSON.parse(raw) as ChosenChurch) : null;
  } catch {
    current = null;
  }
  listeners.forEach((l) => l());
}

export function getChurch() {
  return current;
}

export async function setChurch(next: ChosenChurch | null) {
  current = next;
  listeners.forEach((l) => l());
  if (next) await storage.set(KEY, JSON.stringify(next));
  else await storage.remove(KEY);
}

export function onChurchChange(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** The church address from what someone typed or pasted: a slug, or a /c/<slug> link. */
export function slugFrom(input: string) {
  const s = input.trim().toLowerCase();
  const m = s.match(/\/c\/([a-z0-9-]+)/);
  return (m ? m[1] : s.replace(/^https?:\/\//, '').replace(/[^a-z0-9-]/g, '')).slice(0, 40);
}
