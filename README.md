# xAI Workspace

AI agent workspace for SME business clients. Angular 21 SPA delivered across web, Telegram WebApp, and native iOS/Android via Capacitor 8.

## Platforms

| Channel | Runtime | Status |
|---------|---------|--------|
| Web | Angular SPA on AWS Amplify | Production |
| Telegram | Embedded WebApp | Production |
| iOS | Capacitor 8 native shell | In development |
| Android | Capacitor 8 native shell | In development |

## Quick Start

```bash
npm install
npm start            # Dev server at localhost:4200
```

## Build

```bash
npm run build                # Web production build
npm run build:mobile         # Web build + Capacitor sync
npm run open:ios             # Open Xcode project
npm run open:android         # Open Android Studio project
```

## Test

```bash
npm run e2e                  # Playwright E2E tests
npm run e2e:headed           # Headed browser mode
npm run e2e:ui               # Interactive test UI
```

## Tech Stack

- **Framework**: Angular 21.1 (standalone components, signals)
- **Language**: TypeScript 5.9 (strict)
- **Native**: Capacitor 8.1 (iOS + Android)
- **Styling**: SCSS with CSS custom properties
- **Charts**: Chart.js 4.5
- **i18n**: Custom system, 16 languages, RTL support
- **Auth**: Google, GitHub, LinkedIn OAuth + Telegram Login
- **Realtime**: WebSocket chat with auto-reconnect
- **Testing**: Playwright
- **Deployment**: AWS Amplify (web), App Store / Google Play (native)

## Project Structure

```
src/app/
  app.ts                 # Root component (3-panel responsive layout)
  app.routes.ts          # Route definitions
  components/            # Shared components (chat-panel, agents-panel, toast, back-button)
  pages/                 # Route pages (home, about, analytics, article, invite, models, ...)
  services/              # Injectable services (auth, chat, telegram, platform, storage, ...)
  i18n/                  # Translations (16 languages x 6 content areas + UI strings)
ios/                     # Xcode project (Capacitor-generated)
android/                 # Android Studio project (Capacitor-generated)
Documents/               # Architecture and GDPR compliance docs
e2e/                     # Playwright test specs
```

## Native Mobile (Capacitor)

The app is wrapped in native iOS and Android shells using Capacitor 8. Native features:

- **Push notifications** via FCM/APNs (`@capacitor/push-notifications`)
- **Biometric auth** via Face ID/Touch ID/Fingerprint (`@capgo/capacitor-native-biometric`)
- **Deep links** via Universal Links (iOS) and App Links (Android) (`@capacitor/app`)
- **Native OAuth** via in-app browser + custom scheme callback (`@capacitor/browser`)
- **Haptic feedback** extending Telegram haptics to native (`@capacitor/haptics`)
- **Safe area** insets for notch/Dynamic Island
- **Keyboard** height tracking for chat input (`@capacitor/keyboard`)
- **Persistent storage** via `@capacitor/preferences` (replaces sessionStorage on native)

See [Documents/Architecture.md](Documents/Architecture.md) for full architecture documentation.

## Documentation

- [Architecture](Documents/Architecture.md) — Frontend architecture, service design, build pipeline
- [GDPR Audit](Documents/GDPR-Audit-2026-02-22.md) — Compliance audit with 44+ findings
- [DPIA](Documents/GDPR-DPIA.md) — Data Protection Impact Assessment
- [RoPA](Documents/GDPR-RoPA.md) — Records of Processing Activities
- [Breach Response](Documents/GDPR-Breach-Response-Plan.md) — Incident response procedures
