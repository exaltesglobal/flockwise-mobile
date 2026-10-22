// Demo backend used while EXPO_PUBLIC_USE_MOCKS=true. It runs the real church engine
// (src/core, the same code as the API server) on the device against a sample church,
// saved to device storage so RSVPs, gifts and prayers survive a restart. Nothing leaves
// the phone: gifts succeed instantly and messages are only logged.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createChurchEngine, Db, type Dump } from '@/core';
import { createDemoEnv, readDemoToken } from '@/core/demo';
import { ApiError } from '@/core/errors';
import { seedDemo } from '@/core/seed';

import type { Session } from './types';

export { DEMO_CODE as DEMO_OTP } from '@/core';
// The sample church gives Priya (priya@example.com) a team login with this password.
export const DEMO_PASSWORD = 'demo1234';

const DB_KEY = 'fw.demoDb.v4';
const RESEED_AFTER_DAYS = 7; // event dates are relative to the seed day
const DAY = 86_400_000;

const env = createDemoEnv({ webUrl: 'https://flockwise.church' });
const db = new Db();
const engine = createChurchEngine(db, env);
let loading: Promise<void> | null = null;

function freshSeed() {
  db.load({});
  seedDemo(db, env);
  db.put('meta', { id: 'seededAt', value: String(Date.now()) });
}

function load() {
  loading ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(DB_KEY);
      if (raw) {
        const dump = JSON.parse(raw) as Dump;
        const seededAt = Number(dump.meta?.find((m) => m.id === 'seededAt')?.value ?? 0);
        if (Date.now() - seededAt < RESEED_AFTER_DAYS * DAY) {
          db.load(dump);
          return;
        }
      }
    } catch {
      /* unreadable: fall through to a fresh seed */
    }
    freshSeed();
    await save();
  })();
  return loading;
}

async function save() {
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(db.dump()));
  } catch {
    /* storage full: keep working in memory */
  }
}

export async function resetDemoData() {
  freshSeed();
  await save();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockRequest<T>(method: string, path: string, body: unknown, current: Session | null): Promise<T> {
  await Promise.all([load(), wait(120 + Math.random() * 140)]);
  const [pathname, search = ''] = path.split('?');
  if (pathname.startsWith('/churches/')) return churchLookup(method, pathname, body) as T;
  const claims = readDemoToken(current?.accessToken);
  const auth = claims && claims.scope === 'member' ? claims : null;
  try {
    const result = await engine.handle({ method, path: pathname, query: Object.fromEntries(new URLSearchParams(search)), body: body ?? {}, auth });
    // Hand back a copy so screens can't mutate the demo database by accident.
    return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
  } finally {
    if (method !== 'GET') {
      await engine.tick().catch(() => undefined);
      await save();
    }
  }
}

// The church directory lives outside the church engine on the server; the demo has one church.
const DEMO_SLUGS = ['grace', 'grace-church', 'demo'];
function churchLookup(method: string, pathname: string, body: unknown) {
  const s = db.get('settings', 'church');
  const church = { id: 'ch_demo', slug: 'grace', name: s?.name ?? 'Grace Church', city: s?.city ?? null };
  if (method === 'POST' && pathname === '/churches/find') {
    const email = String((body as { email?: string })?.email ?? '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(422, 'invalid', 'Enter a valid email address.', { email: 'Enter a valid email address' });
    return { sent: true, churches: [church] };
  }
  const slug = decodeURIComponent(pathname.split('/')[2] ?? '');
  if (!DEMO_SLUGS.includes(slug)) throw new ApiError(404, 'church_not_found', 'We could not find that church on Flockwise. In the demo, try "grace".');
  return { ...church, logoUrl: null, isDefault: true };
}
