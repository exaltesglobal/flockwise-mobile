# Flockwise mobile (Android + iOS)

The Flockwise member app, built with [Expo](https://expo.dev) (React Native).
One codebase produces the Android app, the iOS app, and a web preview.

It talks to the Flockwise backend only through a REST API (see
[docs/API.md](docs/API.md)). Until that backend is live on Hostinger, the app
runs on built-in demo data, so it can be designed, tested and shown to churches
now.

## What's in it

- Sign in with a one-time code sent by email
- Home: greeting, next service, announcements, upcoming events
- Events with RSVP
- Giving: funds, preset or custom amounts, one-time or monthly, 80G PAN, FCRA citizenship question; payment via Razorpay/Stripe hosted checkout
- Groups with "ask to join"
- Me: profile, language (English, Hindi), server switch for test builds, sign out
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

The API location is a setting, not code:

| Where | How |
|---|---|
| Local dev | `.env`: `EXPO_PUBLIC_API_URL=https://staging-api.flockwise.church/v1` and `EXPO_PUBLIC_USE_MOCKS=false` |
| Cloud builds | `eas.json` → `build.<profile>.env` |
| A test build already on a phone | Me → Server → paste the URL (not available in store builds) |

Nothing else changes. All calls go through `src/api/endpoints.ts`, and the
demo backend (`src/api/mock.ts`) follows the same contract as `docs/API.md`.

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
  event/[id].tsx     Event detail + RSVP
  settings/server    Server switch for test builds
src/api/             API client, endpoint functions, types, demo backend
src/i18n/            Strings (en, hi). Add a language by adding a file.
src/theme/           Brand colours, fonts, spacing
assets/              Icons, splash, logos and fonts from the brand kit
```

## Notes

- Hindi strings are machine-drafted; have a native speaker review them. Outfit has no Devanagari glyphs, so Hindi falls back to the system font; add Noto Sans Devanagari (and other Indic Noto fonts) before release.
- Run `npx tsc --noEmit` before committing.
