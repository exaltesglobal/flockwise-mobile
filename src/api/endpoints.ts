// One function per backend endpoint (docs/API.md). Screens call these, never fetch() directly.
// The team app only uses the signed-in person's own endpoints, so nobody sees anyone else's data.
import { api } from './client';
import type {
  Assignment,
  Blockout,
  CarolNightView,
  CarolStopStatus,
  ChurchFound,
  ChurchPublic,
  Consent,
  HubChannelDetail,
  HubChannelView,
  HubPost,
  HubPostKind,
  Member,
  MemberPreferences,
  MyServing,
  MyTask,
  TeamRef,
  TeamSession,
} from './types';

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return s ? `?${s}` : '';
};

// The church admin creates each login and the password arrives by email.
export const Auth = {
  teams: () => api.get<TeamRef[]>('/team/teams'),
  signIn: (input: { email: string; password: string; teamId: string }) => api.post<TeamSession>('/auth/team/sign-in', input),
  changePassword: (currentPassword: string, newPassword: string) => api.post<void>('/auth/team/password', { currentPassword, newPassword }),
  forgot: (email: string) => api.post<{ sent: boolean }>('/auth/team/forgot', { email }),
  reset: (input: { email: string; code: string; newPassword: string; teamId: string }) => api.post<TeamSession>('/auth/team/reset', input),
  refresh: (refreshToken: string) => api.post<TeamSession>('/auth/refresh', { refreshToken }),
  signOut: (refreshToken: string) => api.post<void>('/auth/sign-out', { refreshToken }),
};

export const Me = {
  get: () => api.get<Member>('/me'),
  update: (patch: Partial<Pick<Member, 'firstName' | 'lastName' | 'phone' | 'language'>>) => api.patch<Member>('/me', patch),
  preferences: () => api.get<MemberPreferences>('/me/preferences'),
  updatePreferences: (patch: { consent?: Partial<Consent> }) => api.patch<MemberPreferences>('/me/preferences', patch),
  registerDevice: (token: string, platform: 'ios' | 'android') => api.post<void>('/me/devices', { token, platform, app: 'team' }),
  forgetDevice: (token: string) => api.del<void>(`/me/devices?token=${encodeURIComponent(token)}`),
};

export const Churches = {
  bySlug: (slug: string) => api.get<ChurchPublic>(`/churches/${encodeURIComponent(slug)}`),
  find: (email: string) => api.post<{ sent: boolean; churches?: ChurchFound[] }>('/churches/find', { email }),
};

export const Serving = {
  mine: (teamId: string) => api.get<MyServing>(`/me/serving${q({ teamId })}`),
  respond: (id: string, status: 'accepted' | 'declined', note?: string) => api.post<Assignment>(`/me/serving/${id}/respond`, { status, note }),
  addBlockout: (input: { from: string; to: string; reason?: string }) => api.post<Blockout>('/me/blockouts', input),
  deleteBlockout: (id: string) => api.del<void>(`/me/blockouts/${id}`),
};

// Team hub: notices, chat threads and tasks. Every route checks the person is on that team.
export const Hub = {
  notices: (teamId: string) => api.get<HubPost[]>(`/team/${teamId}/notices`),
  threads: (teamId: string) => api.get<HubChannelView[]>(`/team/${teamId}/threads`),
  startThread: (teamId: string, name: string, memberKeys: string[]) => api.post<HubChannelView>(`/team/${teamId}/threads`, { name, memberKeys }),
  messages: (teamId: string, threadId: string, cursor?: string) => api.get<HubChannelDetail>(`/team/${teamId}/threads/${threadId}/messages${q({ cursor })}`),
  post: (teamId: string, threadId: string, input: { kind?: HubPostKind; text: string; task?: { assigneeKey: string; dueAt: string | null } }) =>
    api.post<HubPost>(`/team/${teamId}/threads/${threadId}/messages`, input),
  tasks: () => api.get<MyTask[]>('/me/tasks'),
  setTaskDone: (id: string, done: boolean) => api.patch<HubPost>(`/me/tasks/${id}`, { done }),
};

// Christmas carol rounds: the team's own nights only. Offerings are in minor units (paise).
export const Carols = {
  mine: (teamId: string) => api.get<{ season: { id: string; name: string; fundName: string | null } | null; nights: CarolNightView[] }>(`/team/${teamId}/carols`),
  updateStop: (teamId: string, nightId: string, key: string, patch: { status?: CarolStopStatus; offering?: number | null; note?: string }) =>
    api.patch<CarolNightView>(`/team/${teamId}/carols/${nightId}/stops/${encodeURIComponent(key)}`, patch),
};
