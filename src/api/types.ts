// Shapes returned by the Flockwise REST API (docs/API.md). The definitions live in the
// shared engine (src/core/types.ts, copied from flockwise-api) so the server, the demo
// and the screens can never drift apart.
export type {
  ApiErrorBody,
  Assignment,
  AssignmentStatus,
  Blockout,
  Church,
  ChurchEvent,
  Consent,
  LanguageCode,
  Member,
  MemberPreferences,
  MyServing,
  OtpRequest,
  PlanItem,
  Session,
} from '@/core/types';

// ----- team sign-in (flockwise-api: /team/teams, /auth/team/*) -----
import type { Session } from '@/core/types';

/** A serving team, as listed on the sign-in screen. */
export type TeamRef = { id: string; name: string; color: string };

/** The team app's session: the person, plus the one team they signed in for. */
export type TeamSession = Session & {
  team: { id: string; name: string };
  /** Set when the church admin made the login: the emailed password must be changed first. */
  mustChangePassword: boolean;
};

/** A church on the Flockwise server, looked up by its address. */
export type ChurchPublic = { id: string; slug: string; name: string; city: string | null; logoUrl: string | null; isDefault: boolean };
export type ChurchFound = { slug: string; name: string; city: string | null };
