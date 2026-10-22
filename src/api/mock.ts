// Demo backend used while EXPO_PUBLIC_USE_MOCKS=true. It mirrors docs/API.md so
// screens behave the same once the real Hostinger API is switched on.
import { ApiError } from './errors';
import type {
  Announcement,
  ChurchEvent,
  Donation,
  Fund,
  GiveIntentInput,
  Group,
  Member,
  Session,
} from './types';

const DEMO_OTP = '123456';

const day = 24 * 60 * 60 * 1000;
function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date(Date.now() + daysFromNow * day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function nextSunday(hour: number) {
  const now = new Date();
  const add = (7 - now.getDay()) % 7 || 7;
  return at(add, hour);
}

let member: Member = {
  id: 'mem_demo',
  firstName: 'Priya',
  lastName: 'Thomas',
  phone: '+91 98765 43210',
  email: 'priya@example.com',
  language: 'en',
  householdName: 'Thomas family',
};

const church: Session['church'] = {
  id: 'ch_demo',
  name: 'Grace Community Church',
  city: 'Hyderabad',
  country: 'IN',
  currency: 'INR',
  paymentProvider: 'razorpay',
};

const announcements: Announcement[] = [
  {
    id: 'an_1',
    title: 'Christmas choir auditions',
    body: 'Auditions for the Christmas choir are open after both services this Sunday. Speak to Pastor Samuel at the welcome desk.',
    publishedAt: at(-1, 9),
  },
  {
    id: 'an_2',
    title: 'Blood donation drive',
    body: 'Together with a city blood bank we are hosting a donation camp in the fellowship hall. Please bring a photo ID.',
    publishedAt: at(-3, 18),
  },
];

const events: ChurchEvent[] = [
  {
    id: 'ev_service',
    kind: 'service',
    title: 'Sunday Worship (English)',
    description: 'Join us for worship, the Word and fellowship. Kids church runs alongside the service.',
    startsAt: nextSunday(9),
    endsAt: nextSunday(11),
    location: 'Main Sanctuary',
    goingCount: 812,
    capacity: null,
    myRsvp: null,
  },
  {
    id: 'ev_youth',
    kind: 'event',
    title: 'Youth Night',
    description: 'Games, worship and a short talk for ages 13 to 19. Snacks provided.',
    startsAt: at(2, 18, 30),
    endsAt: at(2, 21),
    location: 'Fellowship Hall',
    goingCount: 64,
    capacity: 120,
    myRsvp: 'going',
  },
  {
    id: 'ev_blood',
    kind: 'event',
    title: 'Blood Donation Camp',
    description: 'Give blood, save lives. Volunteers needed for registration and refreshments.',
    startsAt: at(6, 9),
    endsAt: at(6, 15),
    location: 'Fellowship Hall',
    goingCount: 41,
    capacity: 150,
    myRsvp: null,
  },
  {
    id: 'ev_marriage',
    kind: 'event',
    title: 'Marriage Enrichment Evening',
    description: 'An evening for couples with dinner, a talk and time to connect.',
    startsAt: at(12, 19),
    endsAt: at(12, 21, 30),
    location: 'Banquet Room, 2nd floor',
    goingCount: 28,
    capacity: 40,
    myRsvp: null,
  },
];

const groups: Group[] = [
  {
    id: 'gr_1',
    name: 'Kondapur Home Group',
    description: 'Bible study and prayer for families in Kondapur and Gachibowli.',
    meetingSchedule: 'Wednesdays, 7:30 pm',
    location: 'Kondapur',
    leaderName: 'Joseph & Anita',
    memberCount: 18,
    membership: 'member',
  },
  {
    id: 'gr_2',
    name: 'Young Professionals',
    description: 'For working adults in their 20s and 30s. Meets near HITEC City.',
    meetingSchedule: 'Fridays, 8:00 pm',
    location: 'HITEC City',
    leaderName: 'Rahul Varghese',
    memberCount: 32,
    membership: 'none',
  },
  {
    id: 'gr_3',
    name: "Women's Prayer Fellowship",
    description: 'Prayer, worship and encouragement every Saturday morning.',
    meetingSchedule: 'Saturdays, 10:00 am',
    location: 'Prayer Room',
    leaderName: 'Mercy Daniel',
    memberCount: 45,
    membership: 'none',
  },
];

const funds: Fund[] = [
  { id: 'fd_tithe', name: 'Tithes & Offerings', description: 'General ministry of the church.', taxDeductible: true },
  { id: 'fd_building', name: 'Building Fund', description: 'New sanctuary construction.', taxDeductible: true },
  { id: 'fd_missions', name: 'Missions', description: 'Church planting in North India.', taxDeductible: false },
];

const donations: Donation[] = [
  { id: 'dn_1', fundName: 'Tithes & Offerings', amount: 500000, currency: 'INR', frequency: 'monthly', status: 'succeeded', createdAt: at(-20, 10), receiptUrl: null },
  { id: 'dn_2', fundName: 'Missions', amount: 100000, currency: 'INR', frequency: 'once', status: 'succeeded', createdAt: at(-45, 12), receiptUrl: null },
];

function session(): Session {
  return {
    accessToken: 'demo-access',
    refreshToken: 'demo-refresh',
    expiresAt: new Date(Date.now() + 30 * day).toISOString(),
    member,
    church,
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockRequest<T>(method: string, path: string, body?: any): Promise<T> {
  await wait(250);
  const [route] = path.split('?');
  const parts = route.split('/').filter(Boolean);
  const key = `${method} /${parts.map((p) => (/^(ev|gr|fd|dn)_/.test(p) ? ':id' : p)).join('/')}`;
  const id = parts.find((p) => /^(ev|gr|fd|dn)_/.test(p));

  switch (key) {
    case 'POST /auth/otp/request':
      if (!/^\S+@\S+\.\S+$/.test(body?.email ?? '')) throw new ApiError(422, 'email_required', 'Enter a valid email address.', { email: 'Invalid' });
      member = { ...member, email: body.email };
      return { requestId: 'otp_demo', channel: 'email', expiresInSeconds: 600 } as T;
    case 'POST /auth/otp/verify':
      if (body?.code !== DEMO_OTP) throw new ApiError(422, 'invalid_code', `That code is not right. In demo mode use ${DEMO_OTP}.`);
      return session() as T;
    case 'POST /auth/refresh':
      return session() as T;
    case 'POST /auth/sign-out':
    case 'POST /me/devices':
      return undefined as T;
    case 'GET /me':
      return member as T;
    case 'PATCH /me':
      member = { ...member, ...body };
      return member as T;
    case 'GET /home':
      return {
        nextService: events.find((e) => e.kind === 'service') ?? null,
        announcements,
        upcomingEvents: events.filter((e) => e.kind === 'event').slice(0, 3),
      } as T;
    case 'GET /events':
      return { data: events, nextCursor: null } as T;
    case 'GET /events/:id': {
      const ev = events.find((e) => e.id === id);
      if (!ev) throw new ApiError(404, 'not_found', 'Event not found.');
      return ev as T;
    }
    case 'PUT /events/:id/rsvp': {
      const ev = events.find((e) => e.id === id);
      if (!ev) throw new ApiError(404, 'not_found', 'Event not found.');
      if (ev.myRsvp !== 'going' && body.status === 'going') ev.goingCount += 1;
      if (ev.myRsvp === 'going' && body.status !== 'going') ev.goingCount -= 1;
      ev.myRsvp = body.status;
      return ev as T;
    }
    case 'GET /groups':
      return { data: groups, nextCursor: null } as T;
    case 'POST /groups/:id/join-requests': {
      const g = groups.find((x) => x.id === id);
      if (!g) throw new ApiError(404, 'not_found', 'Group not found.');
      g.membership = 'requested';
      return g as T;
    }
    case 'GET /giving/funds':
      return funds as T;
    case 'POST /giving/intents': {
      const input = body as GiveIntentInput;
      const fund = funds.find((f) => f.id === input.fundId);
      const d: Donation = {
        id: `dn_${Date.now()}`,
        fundName: fund?.name ?? 'Gift',
        amount: input.amount,
        currency: input.currency,
        frequency: input.frequency,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
      };
      donations.unshift(d);
      return { donationId: d.id, checkoutUrl: 'https://flockwise.church/?demo-checkout' } as T;
    }
    case 'GET /giving/donations':
      return { data: donations, nextCursor: null } as T;
  }
  throw new ApiError(404, 'not_found', `Demo API has no route for ${method} ${route}`);
}
