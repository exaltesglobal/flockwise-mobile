// One function per backend endpoint (docs/API.md). Screens call these, never fetch() directly.
// The team app only uses the signed-in person's own endpoints, so nobody sees anyone else's data.
import { api } from './client';
import type { Assignment, Blockout, Consent, Member, MemberPreferences, MyServing, TeamRef, TeamSession } from './types';

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return s ? `?${s}` : '';
};

// The church admin creates each login and the password arrives by email.
export const Auth = {
  teams: () => api.get<TeamRef[]>('/team/teams'),
  signIn: (input: { email: string; password: string; teamId: string }) => api.post<TeamSession>('/auth/team/sign-in', input),
  changePassword: (currentPassword: string, newPassword: string) => api.post<void>('/auth/team/password', { currentPassword, newPassword }),
  forgot: (email: string) => api.post<{ ok: boolean }>('/auth/team/forgot', { email }),
  reset: (input: { email: string; code: string; newPassword: string; teamId: string }) => api.post<TeamSession>('/auth/team/reset', input),
  refresh: (refreshToken: string) => api.post<TeamSession>('/auth/refresh', { refreshToken }),
  signOut: (refreshToken: string) => api.post<void>('/auth/sign-out', { refreshToken }),
};

export const Me = {
  get: () => api.get<Member>('/me'),
  update: (patch: Partial<Pick<Member, 'firstName' | 'lastName' | 'phone' | 'language'>>) => api.patch<Member>('/me', patch),
  preferences: () => api.get<MemberPreferences>('/me/preferences'),
  updatePreferences: (patch: { consent?: Partial<Consent> }) => api.patch<MemberPreferences>('/me/preferences', patch),
  registerDevice: (token: string, platform: 'ios' | 'android') => api.post<void>('/me/devices', { token, platform }),
};

export const Serving = {
  mine: (teamId: string) => api.get<MyServing>(`/me/serving${q({ teamId })}`),
  respond: (id: string, status: 'accepted' | 'declined', note?: string) => api.post<Assignment>(`/me/serving/${id}/respond`, { status, note }),
  addBlockout: (input: { from: string; to: string; reason?: string }) => api.post<Blockout>('/me/blockouts', input),
  deleteBlockout: (id: string) => api.del<void>(`/me/blockouts/${id}`),
};
