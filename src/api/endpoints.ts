// One function per backend endpoint (docs/API.md). Screens call these, never fetch() directly.
import { api } from './client';
import type {
  Assignment,
  Blockout,
  Campus,
  CheckinCode,
  ChurchEvent,
  Consent,
  DirectoryEntry,
  Donation,
  Fund,
  GiveIntent,
  GiveIntentInput,
  GivingStatement,
  Group,
  HomeFeed,
  Member,
  MemberPreferences,
  MyServing,
  OtpRequest,
  Paginated,
  PledgeView,
  PrayerView,
  RsvpStatus,
  Session,
} from './types';

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return s ? `?${s}` : '';
};

export const Auth = {
  requestOtp: (email: string) => api.post<OtpRequest>('/auth/otp/request', { email }),
  verifyOtp: (requestId: string, code: string) => api.post<Session>('/auth/otp/verify', { requestId, code }),
  refresh: (refreshToken: string) => api.post<Session>('/auth/refresh', { refreshToken }),
  signOut: (refreshToken: string) => api.post<void>('/auth/sign-out', { refreshToken }),
};

export const Me = {
  get: () => api.get<Member>('/me'),
  update: (patch: Partial<Pick<Member, 'firstName' | 'lastName' | 'email' | 'phone' | 'language'>>) => api.patch<Member>('/me', patch),
  preferences: () => api.get<MemberPreferences>('/me/preferences'),
  updatePreferences: (patch: { consent?: Partial<Consent>; campusId?: string | null }) => api.patch<MemberPreferences>('/me/preferences', patch),
  checkinCode: () => api.get<CheckinCode>('/me/checkin-code'),
  registerDevice: (token: string, platform: 'ios' | 'android') => api.post<void>('/me/devices', { token, platform }),
};

export const Church = {
  campuses: () => api.get<Campus[]>('/campuses'),
};

export const Home = {
  feed: () => api.get<HomeFeed>('/home'),
};

export const Events = {
  list: (cursor?: string) => api.get<Paginated<ChurchEvent>>(`/events${q({ cursor })}`),
  get: (id: string) => api.get<ChurchEvent>(`/events/${id}`),
  rsvp: (id: string, status: RsvpStatus) => api.put<ChurchEvent>(`/events/${id}/rsvp`, { status }),
  buyTicket: (id: string) => api.post<GiveIntent>(`/events/${id}/ticket`),
  checkIn: (id: string) => api.post<ChurchEvent>(`/events/${id}/check-in`),
};

export const Groups = {
  list: () => api.get<Paginated<Group>>('/groups'),
  requestToJoin: (id: string) => api.post<Group>(`/groups/${id}/join-requests`),
};

export const Giving = {
  funds: () => api.get<Fund[]>('/giving/funds'),
  createIntent: (input: GiveIntentInput) => api.post<GiveIntent>('/giving/intents', input),
  history: (cursor?: string) => api.get<Paginated<Donation>>(`/giving/donations${q({ cursor })}`),
  statement: (financialYear?: string) => api.get<GivingStatement>(`/giving/statement${q({ financialYear })}`),
  pledges: () => api.get<PledgeView[]>('/giving/pledges'),
  createPledge: (input: { fundId: string; amount: number; endDate: string; startDate?: string }) => api.post<PledgeView>('/giving/pledges', input),
  deletePledge: (id: string) => api.del<void>(`/giving/pledges/${id}`),
};

export const Serving = {
  mine: () => api.get<MyServing>('/me/serving'),
  respond: (id: string, status: 'accepted' | 'declined', note?: string) => api.post<Assignment>(`/me/serving/${id}/respond`, { status, note }),
  addBlockout: (input: { from: string; to: string; reason?: string }) => api.post<Blockout>('/me/blockouts', input),
  deleteBlockout: (id: string) => api.del<void>(`/me/blockouts/${id}`),
};

export const Prayer = {
  list: (cursor?: string) => api.get<Paginated<PrayerView>>(`/prayer${q({ cursor })}`),
  create: (text: string, visibility: 'church' | 'pastors') => api.post<PrayerView>('/prayer', { text, visibility }),
  pray: (id: string) => api.post<PrayerView>(`/prayer/${id}/pray`),
  update: (id: string, patch: { status: 'open' | 'answered'; answeredNote?: string }) => api.patch<PrayerView>(`/prayer/${id}`, patch),
};

export const Directory = {
  search: (query?: string, cursor?: string) => api.get<Paginated<DirectoryEntry>>(`/directory${q({ q: query, cursor })}`),
};
