// Demo backend used while EXPO_PUBLIC_USE_MOCKS=true. It runs the real church engine
// (src/core, the same code as the API server) on the device against a sample church,
// saved to device storage so RSVPs, gifts and prayers survive a restart. Nothing leaves
// the phone: gifts succeed instantly and messages are only logged.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError, createChurchEngine, DEMO_CODE, Db, type Dump } from '@/core';
import { createDemoEnv, readDemoToken } from '@/core/demo';
import { seedDemo } from '@/core/seed';

import type { MyServing, Session, TeamRef, TeamSession } from './types';

export { DEMO_CODE as DEMO_OTP } from '@/core';

const DB_KEY = 'fw.demoDb.v2';
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

// ----- team sign-in -----
// Stand-in for flockwise-api's /team/teams and /auth/team/* until the shared engine has them.
// Every team member with an email signs in with DEMO_PASSWORD; reset codes are DEMO_CODE.
export const DEMO_PASSWORD = 'demo1234';
const pwKey = (personId: string) => `teamPw.${personId}`;
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function teamPerson(email: string) {
  const person = db.all('people').find((p) => norm(p.email) === email);
  return person && db.all('teams').some((t) => t.members.some((m) => m.personId === person.id)) ? person : undefined;
}

async function teamSession(email: string, teamId: string): Promise<TeamSession> {
  const team = db.get('teams', teamId);
  const person = teamPerson(email);
  if (!team) throw new ApiError(422, 'invalid', 'Choose your team.');
  if (!person) throw new ApiError(401, 'invalid_credentials', 'That email or password is not right.');
  if (!team.members.some((m) => m.personId === person.id))
    throw new ApiError(403, 'not_on_team', `You're not on the ${team.name} team. Choose your own team, or ask your leader to add you.`);
  // The engine's demo code sign-in issues the tokens; it finds the person by email.
  const { requestId } = (await engine.handle({ method: 'POST', path: '/auth/otp/request', query: {}, body: { email }, auth: null })) as { requestId: string };
  const session = (await engine.handle({ method: 'POST', path: '/auth/otp/verify', query: {}, body: { requestId, code: DEMO_CODE }, auth: null })) as Session;
  return { ...session, team: { id: team.id, name: team.name }, mustChangePassword: false };
}

async function teamRoute(method: string, path: string, query: URLSearchParams, body: Record<string, unknown>, me: string | null): Promise<{ handled: boolean; result?: unknown }> {
  const route = `${method} ${path}`;
  if (route === 'GET /team/teams') return { handled: true, result: db.all('teams').map((t): TeamRef => ({ id: t.id, name: t.name, color: t.color })) };
  if (route === 'POST /auth/team/sign-in') {
    const email = norm(body.email);
    const person = teamPerson(email);
    const password = person ? (db.get('meta', pwKey(person.id))?.value ?? DEMO_PASSWORD) : null;
    if (!person || String(body.password ?? '') !== password) throw new ApiError(401, 'invalid_credentials', `That email or password is not right. In demo mode the password is ${DEMO_PASSWORD}.`);
    return { handled: true, result: await teamSession(email, String(body.teamId ?? '')) };
  }
  if (route === 'POST /auth/team/forgot') return { handled: true, result: { ok: true } };
  if (route === 'POST /auth/team/reset') {
    if (String(body.code ?? '').trim() !== DEMO_CODE) throw new ApiError(422, 'invalid_code', `That code is not right. In demo mode use ${DEMO_CODE}.`);
    if (String(body.newPassword ?? '').length < 8) throw new ApiError(422, 'weak_password', 'Use at least 8 characters.', { newPassword: 'At least 8 characters' });
    const email = norm(body.email);
    const person = teamPerson(email);
    if (person) db.put('meta', { id: pwKey(person.id), value: String(body.newPassword) });
    return { handled: true, result: await teamSession(email, String(body.teamId ?? '')) };
  }
  if (route === 'POST /auth/team/password') {
    if (!me) throw new ApiError(401, 'unauthorized', 'Please sign in again.');
    if (String(body.currentPassword ?? '') !== (db.get('meta', pwKey(me))?.value ?? DEMO_PASSWORD)) throw new ApiError(422, 'wrong_password', 'Your current password is not right.', { currentPassword: 'Not right' });
    if (String(body.newPassword ?? '').length < 8) throw new ApiError(422, 'weak_password', 'Use at least 8 characters.', { newPassword: 'At least 8 characters' });
    db.put('meta', { id: pwKey(me), value: String(body.newPassword) });
    return { handled: true, result: undefined };
  }
  if (route === 'GET /me/serving' && query.get('teamId')) {
    const teamId = query.get('teamId');
    const all = (await engine.handle({ method, path, query: {}, body: {}, auth: me ? { sub: me, staffId: null, scope: 'member' } : null })) as MyServing;
    return { handled: true, result: { ...all, assignments: all.assignments.filter((a) => a.teamId === teamId), teams: all.teams.filter((t) => t.id === teamId) } };
  }
  return { handled: false };
}

export async function mockRequest<T>(method: string, path: string, body: unknown, current: Session | null): Promise<T> {
  await Promise.all([load(), wait(120 + Math.random() * 140)]);
  const [pathname, search = ''] = path.split('?');
  const claims = readDemoToken(current?.accessToken);
  const auth = claims && claims.scope === 'member' ? claims : null;
  try {
    const team = await teamRoute(method, pathname, new URLSearchParams(search), (body ?? {}) as Record<string, unknown>, auth?.sub ?? null);
    const result = team.handled ? team.result : await engine.handle({ method, path: pathname, query: Object.fromEntries(new URLSearchParams(search)), body: body ?? {}, auth });
    // Hand back a copy so screens can't mutate the demo database by accident.
    return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
  } finally {
    if (method !== 'GET') {
      await engine.tick().catch(() => undefined);
      await save();
    }
  }
}
