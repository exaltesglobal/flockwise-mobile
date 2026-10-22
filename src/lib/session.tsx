import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { configureAuth } from '@/api/client';
import { Auth } from '@/api/endpoints';
import type { Member, Session } from '@/api/types';

import { loadChurch } from './church';
import { loadRuntimeConfig } from './config';
import { storage } from './storage';

const SESSION_KEY = 'fw.session';

type Status = 'loading' | 'signedOut' | 'signedIn';

type SessionContextValue = {
  status: Status;
  session: Session | null;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  updateMember: (member: Member) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);

  const persist = useCallback(async (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    setStatus(next ? 'signedIn' : 'signedOut');
    if (next) await storage.set(SESSION_KEY, JSON.stringify(next));
    else await storage.remove(SESSION_KEY);
  }, []);

  const signOut = useCallback(async () => {
    const current = sessionRef.current;
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
          await persist(await Auth.refresh(current.refreshToken));
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
      const saved = raw ? (JSON.parse(raw) as Session) : null;
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
