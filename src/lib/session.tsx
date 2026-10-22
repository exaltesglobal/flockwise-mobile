import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { configureAuth } from '@/api/client';
import { Auth } from '@/api/endpoints';
import type { Member, TeamSession } from '@/api/types';

import { loadChurch } from './church';
import { loadRuntimeConfig } from './config';
import { forgetPushDevice } from './push';
import { storage } from './storage';

const SESSION_KEY = 'fw.teamSession';

type Status = 'loading' | 'signedOut' | 'signedIn';

type SessionContextValue = {
  status: Status;
  session: TeamSession | null;
  signIn: (session: TeamSession) => Promise<void>;
  signOut: () => Promise<void>;
  updateMember: (member: Member) => void;
  passwordChanged: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<TeamSession | null>(null);
  const sessionRef = useRef<TeamSession | null>(null);

  const persist = useCallback(async (next: TeamSession | null) => {
    sessionRef.current = next;
    setSession(next);
    setStatus(next ? 'signedIn' : 'signedOut');
    if (next) await storage.set(SESSION_KEY, JSON.stringify(next));
    else await storage.remove(SESSION_KEY);
  }, []);

  const signOut = useCallback(async () => {
    const current = sessionRef.current;
    if (current) await forgetPushDevice();
    await persist(null);
    if (current) Auth.signOut(current.refreshToken).catch(() => {});
  }, [persist]);

  useEffect(() => {
    configureAuth({
      getSession: () => sessionRef.current,
      refresh: async () => {
        const current = sessionRef.current;
        if (!current) return false;
        try {
          // The refreshed tokens don't repeat the team; keep the one the person signed in for.
          const next = await Auth.refresh(current.refreshToken);
          await persist({ ...next, team: current.team, mustChangePassword: current.mustChangePassword });
          return true;
        } catch {
          return false;
        }
      },
      onUnauthorized: () => void persist(null),
    });

    (async () => {
      await Promise.all([loadRuntimeConfig(), loadChurch()]);
      const raw = await storage.get(SESSION_KEY);
      const parsed = raw ? (JSON.parse(raw) as TeamSession) : null;
      const saved = parsed?.team ? parsed : null;
      sessionRef.current = saved;
      setSession(saved);
      setStatus(saved ? 'signedIn' : 'signedOut');
    })();
  }, [persist]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      signIn: persist,
      signOut,
      updateMember: (member) => {
        if (sessionRef.current) void persist({ ...sessionRef.current, member });
      },
      passwordChanged: () => {
        if (sessionRef.current) void persist({ ...sessionRef.current, mustChangePassword: false });
      },
    }),
    [status, session, persist, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
