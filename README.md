# Flockwise mobile (Android + iOS)

The Flockwise member app, built with [Expo](https://expo.dev) (React Native).
One codebase produces the Android app, the iOS app, and a web preview.

It talks to the Flockwise backend only through a REST API (see
[docs/API.md](docs/API.md)). Until that backend is live on Hostinger, the app
runs on built-in demo data, so it can be designed, tested and shown to churches
now.

## What's in it

- Sign in with a one-time code sent by email (newcomers become visitors)
- Home: greeting, next service, announcements, upcoming events, check-in QR shortcut
- Events: RSVP, paid tickets (Razorpay checkout), self check-in from 1 hour before start
- Giving: funds, one-time or monthly, 80G PAN, FCRA citizenship question, pledges with progress, yearly 80G statement as a shareable PDF
- Groups with "ask to join"
- Serving: accept or decline rota requests, order of service, dates away (blockouts)
- Prayer wall: share (whole church or pastors only), "I prayed", mark answered
- Member directory (opt-in) with call, WhatsApp and email
- Me: check-in QR code, campus, message and directory consent, language (English, Hindi, Tamil, Telugu, Malayalam, Kannada), server switch for test builds
- Flockwise branding: colours, Outfit + Source Sans 3 fonts, app icons, splash screen, light and dark mode

## Run it

You need Node.js 20+ and the Expo Go app on your phone.

```bash
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). In demo mode,
sign in with any email and the code `123456`. Press `w` to open it in a browser.

## Connecting the backend later

Demo mode runs the real church engine (`src/core`, copied verbatim from
`flockwise-api/src/core`) on the phone, so demo and production behave the same.
When the backend changes, copy its `src/core` folder over this one.
`metro.config.js` lets Metro resolve the engine's `./x.js` imports.

The API location is a setting, not code:

| Where | How |
|---|---|
| Local dev | `.env`: `EXPO_PUBLIC_API_URL=https://staging-api.flockwise.church/v1` and `EXPO_PUBLIC_USE_MOCKS=false` |
| Cloud builds | `eas.json` → `build.<profile>.env` |
| A test build already on a phone | Me → Server → paste the URL (not available in store builds) |

Nothing else changes. All calls go through `src/api/endpoints.ts`; the contract is `docs/API.md` (same file as in `flockwise-api`).

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
  (auth)/            Welcome, sign-in
  (tabs)/            Home, Events, Give, Groups, Me
  member/            Check-in QR, serving, prayer, directory, pledges, statement
  event/[id].tsx     Event detail + RSVP
  settings/server    Server switch for test builds
src/api/             API client, endpoint functions, types, demo backend
src/core/            Shared church engine (copy of flockwise-api/src/core), used for demo mode
src/i18n/            Strings in 6 languages, shared with the web member portal
src/theme/           Brand colours, fonts, spacing
assets/              Icons, splash, logos and fonts from the brand kit
```

## Notes

- Indian-language strings are machine-drafted; have native speakers review them. Outfit has no Indic glyphs, so those languages use the phone's system font.
- Run `npx tsc --noEmit` before committing.
