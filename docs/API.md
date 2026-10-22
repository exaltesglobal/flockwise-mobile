# Flockwise Team app API (v1)

The endpoints the Flockwise Team app (Android and iOS) calls. The app is for church team members only:
the church admin creates each login, and every person sees only their own assignments. Everything
here is part of `flockwise-api`; its full member and office API is in that repo's `docs/API.md` and
`docs/API-ADMIN.md`. Shapes are in `src/core/types.ts`.

## Conventions

- **Base URL**: `https://api.flockwise.church/v1` (`EXPO_PUBLIC_API_URL`).
- **Format**: JSON in and out.
- **Auth**: `Authorization: Bearer <accessToken>` on everything except `/auth/*` and `/team/teams`. Access tokens last 1 hour; refresh tokens rotate on every use.
- **Tenancy**: one server hosts many churches. Before sign-in the app sends `X-Church: <slug>` (the church address, as in `app.flockwise.church/c/<slug>`); after sign-in the church comes from the token. With no header the server's own church is used.
- **Church lookup** (no sign-in): `GET /churches/:slug` → `{ id, slug, name, city, logoUrl, isDefault }` or `404 church_not_found`; `POST /churches/find { email }` → `{ sent: true }` and the server emails the matching church addresses.
- **Time**: ISO 8601 UTC. Dates without time (`from`, `to`) are `YYYY-MM-DD`.
- **Errors**: non-2xx with `{ "error": { "code", "message", "fields"? } }`. `message` is safe to show. On `401`, call `/auth/refresh` once, then sign out if that fails.

## Team sign-in

The church admin makes a login for a team member in the office (Volunteers › Teams › Send app login).
The person gets a temporary password by email, picks their team on the sign-in screen, signs in and
must choose their own password before anything else.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/team/teams` | | `[{ id, name, color }]` for the team picker |
| POST | `/auth/team/sign-in` | `{ email, password, teamId }` | `TeamSession` |
| POST | `/auth/team/password` | `{ currentPassword, newPassword }` (signed in) | `204` |
| POST | `/auth/team/forgot` | `{ email }` | `{ ok: true }` always; emails a 6-digit code if a login exists |
| POST | `/auth/team/reset` | `{ email, code, newPassword, teamId }` | `TeamSession` |
| POST | `/auth/refresh` | `{ refreshToken }` | `Session` (the app keeps the team from sign-in) |
| POST | `/auth/sign-out` | `{ refreshToken }` | `204` |

`TeamSession` is the usual `Session` (`accessToken`, `refreshToken`, `expiresAt`, `member`, `church`)
plus `team: { id, name }` and `mustChangePassword`. Passwords are at least 8 characters.

Errors: `invalid_credentials` (401, same for an unknown email and a wrong password), `not_on_team`
(403), `login_disabled` (403), `too_many_attempts` (429), `invalid_code`, `code_expired`,
`wrong_password`, `weak_password` (422).

## Me

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/me` | | `Member` |
| PATCH | `/me` | `{ firstName?, lastName?, phone?, language? }` | `Member` |
| GET | `/me/preferences` | | `{ consent: { email, sms, whatsapp, directory }, ... }` |
| PATCH | `/me/preferences` | `{ consent?: Partial<Consent> }` | same |
| POST | `/me/devices` | `{ token, platform: "ios"\|"android", app: "team" }` | `204`. Expo push token. Sent after sign-in. |
| DELETE | `/me/devices?token=` | | `204`. Sent on sign-out, so the phone stops getting pushes. |

Pushes carry `data: { kind, link? }`. A `link` of `/app/serving/<id>` opens that assignment; anything else opens the schedule. Pushes need `EAS_PROJECT_ID` set at build time.

`language` is one of `en, hi, ta, te, ml, kn`.

## My serving

Only the signed-in person's own rows, for the team they signed in for.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/me/serving?teamId=` | | `{ assignments: [...{ event, teamName, positionName, status, note, plan: PlanItem[] }], teams, blockouts }` |
| POST | `/me/serving/:id/respond` | `{ status: "accepted"\|"declined", note? }` | `Assignment` |
| POST | `/me/blockouts` | `{ from, to, reason? }` | `Blockout` |
| DELETE | `/me/blockouts/:id` | | `204` |

`plan` (the order of service) is only sent for accepted assignments. Away dates (blockouts) apply to
every team the person is on.

## Team hub (notices, chats, tasks)

Full contract: flockwise-api `docs/API-ADMIN.md`, "Team hub: notices, threads and tasks". The app uses:

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/team/:teamId/notices` | | `HubPost[]` |
| GET | `/team/:teamId/threads` | | `HubChannelView[]` (team channel first) |
| POST | `/team/:teamId/threads` | `{ name, memberKeys }` | `HubChannelView` |
| GET | `/team/:teamId/threads/:id/messages?cursor=` | | `HubChannelDetail` (newest first, 50 a page) |
| POST | `/team/:teamId/threads/:id/messages` | `{ kind?, text, task? }` | `HubPost` |
| GET | `/me/tasks` | | `MyTask[]` |
| PATCH | `/me/tasks/:id` | `{ done }` | the task |

Push links: `/app/team/<teamId>/threads/<id>` opens that chat, `/app/tasks/<id>` opens Tasks.
