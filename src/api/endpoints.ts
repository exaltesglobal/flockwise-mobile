// One function per backend endpoint. Screens call these, never fetch() directly.
import { api } from './client';
import type {
  ChurchEvent,
  Donation,
  Fund,
  GiveIntent,
  GiveIntentInput,
  Group,
  HomeFeed,
  Member,
  OtpRequest,
  Paginated,
  RsvpStatus,
  Session,
} from './types';

export const Auth = {
  requestOtp: (email: string) => api.post<OtpRequest>('/auth/otp/request', { email }),
  verifyOtp: (requestId: string, code: string) => api.post<Session>('/auth/otp/verify', { requestId, code }),
  refresh: (refreshToken: string) => api.post<Session>('/auth/refresh', { refreshToken }),
  signOut: (refreshToken: string) => api.post<void>('/auth/sign-out', { refreshToken }),
};

export const Me = {
  get: () => api.get<Member>('/me'),
  update: (patch: Partial<Pick<Member, 'firstName' | 'lastName' | 'email' | 'language'>>) => api.patch<Member>('/me', patch),
  registerDevice: (pushToken: string, platform: 'ios' | 'android') => api.post<void>('/me/devices', { pushToken, platform }),
};

export const Home = {
  feed: () => api.get<HomeFeed>('/home'),
};

export const Events = {
  list: (cursor?: string) => api.get<Paginated<ChurchEvent>>(`/events${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
  get: (id: string) => api.get<ChurchEvent>(`/events/${id}`),
  rsvp: (id: string, status: RsvpStatus) => api.put<ChurchEvent>(`/events/${id}/rsvp`, { status }),
};

export const Groups = {
  list: () => api.get<Paginated<Group>>('/groups'),
  requestToJoin: (id: string) => api.post<Group>(`/groups/${id}/join-requests`),
};

export const Giving = {
  funds: () => api.get<Fund[]>('/giving/funds'),
  createIntent: (input: GiveIntentInput) => api.post<GiveIntent>('/giving/intents', input),
  history: (cursor?: string) => api.get<Paginated<Donation>>(`/giving/donations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
};
