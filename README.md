# Flockwise mobile (Android + iOS)

Flockwise Team, the app for church team members (worship, media, ushers, kids' church and so on), built with [Expo](https://expo.dev) (React Native).
One codebase produces the Android app, the iOS app, and a web preview.

It talks to the Flockwise backend only through a REST API (see
[docs/API.md](docs/API.md)). Until that backend is live on Hostinger, the app
runs on built-in demo data, so it can be designed, tested and shown to churches
now.

## What's in it

The app is for team members only, not the wider congregation (members use the web portal). Each
person sees only what they are assigned to, never anyone else's data.

- Sign-in: choose your team, then your email and the password the church admin emailed you. The
  emailed password must be changed on first sign-in. Forgot password sends a code by email.
- Schedule: requests waiting for your reply, the next time you serve, everything coming up
- Assignment: date, place, your role, accept or decline (with a reason), and the order of service
  (songs with keys and arrangement, readings, who leads each part, minutes) once you accept
- Away: dates you can't serve, so nobody schedules you then
- Me: your team and positions, change password, language (English, Hindi, Tamil, Telugu, Malayalam,
  Kannada), reminder channels, switch team, server switch for test builds
- Flockwise branding: colours, Outfit + Source Sans 3 fonts, app icons, splash screen, light and dark mode

## Run it

You need Node.js 20+ and the Expo Go app on your phone.

```bash
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). In demo mode,
choose Worship and sign in as `priya@example.com` with the password `demo1234`
(password reset codes are `123456`). Press `w` to open it in a browser.

## Connecting the backend later

Demo mode runs the real church engine (`src/core`, copied verbatim from
`flockwise-api/src/core`) on the phone, so demo and production behave the same.
When the backend changes, copy its `src/core` folder over this one. Team sign-in
(`/team/teams`, `/auth/team/*`) is faked in `src/api/mock.ts` until the engine has it;
remove that stand-in once a synced `src/core` handles those routes.
`metro.config.js` lets Metro resolve the engine's `./x.js` imports.

The API location is a setting, not code:

| Where | How |
|---|---|
| Local dev | `.env`: `EXPO_PUBLIC_API_URL=https://staging-api.flockwise.church/v1` and `EXPO_PUBLIC_USE_MOCKS=false` |
| Cloud builds | `eas.json` → `build.<profile>.env` |
| A test build already on a phone | Me → Server → paste the URL (not available in store builds) |

Nothing else changes. All calls go through `src/api/endpoints.ts`; the contract is `docs/API.md`.

## Building for the stores

Builds run in Expo's cloud (EAS), so no Mac is needed for iOS.

```bash
npm install -g eas-cli
eas login
eas init                          # links the project, sets the project id
eas build --profile preview -p android   # installable APK for testers
eas build --profile production -p all    # store builds
eas submit -p android / -p ios           # upload to Play Console / App Store Connect
```

You'll need a Google Play developer account (one-time $25) and an Apple
Developer account ($99/year). App ids: `church.flockwise.app` on both stores.

## Project layout

```
app.config.ts        App name, ids, icons, splash, API URL (from env)
eas.json             Build profiles: development, preview, production
src/app/             Screens (Expo Router: every file is a route)
  (auth)/            Welcome, sign-in (team picker + password), forgot password
  (tabs)/            Schedule, Away, Me
  assignment/[id]    One assignment: reply and order of service
  settings/password  Change password (forced after the first sign-in)
  settings/server    Server switch for test builds
src/api/             API client, endpoint functions, types, demo backend
src/core/            Shared church engine (copy of flockwise-api/src/core), used for demo mode
src/i18n/            Strings in 6 languages: shared ones from the web portal, team ones in team.ts
src/theme/           Brand colours, fonts, spacing
assets/              Icons, splash, logos and fonts from the brand kit
```

## Notes

- Indian-language strings are machine-drafted; have native speakers review them. Outfit has no Indic glyphs, so those languages use the phone's system font.
- Run `npx tsc --noEmit` before committing.
