// Shapes returned by the Flockwise REST API (docs/API.md). The definitions live in the
// shared engine (src/core/types.ts, copied from flockwise-api) so the server, the demo
// and the screens can never drift apart.
export type {
  Announcement,
  ApiErrorBody,
  Assignment,
  AssignmentStatus,
  Blockout,
  Campus,
  Church,
  ChurchEvent,
  Consent,
  Currency,
  DirectoryEntry,
  Donation,
  Fund,
  GiveFrequency,
  GiveIntent,
  GiveIntentInput,
  GivingStatement,
  Group,
  HomeFeed,
  LanguageCode,
  Member,
  MemberPreferences,
  MyServing,
  OtpRequest,
  Paginated,
  PlanItem,
  PledgeView,
  PrayerView,
  RsvpStatus,
  Session,
} from '@/core/types';

export type CheckinCode = { code: string; qr: string; name: string };
