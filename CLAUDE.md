# CLAUDE.md — Project Instructions for AI Assistants

## Project Overview

xAI Workspace is an Angular 21 SPA that provides AI agent assistance to SME business clients. It runs on three platforms: web browser, Telegram WebApp, and native iOS/Android via Capacitor 8.

## Key Commands

```bash
npm start                    # Dev server at localhost:4200
npm run build                # Production web build
npm run build:mobile         # Production build + cap sync (both platforms)
npm run cap:sync             # Sync web assets to native projects
npm run open:ios             # Open Xcode project
npm run open:android         # Open Android Studio project
npm run e2e                  # Playwright E2E tests
npm run gplay:auth           # One-time Google Play OAuth login
npm run gplay:build          # Build Android AAB
npm run gplay:publish        # Build + upload to Google Play internal track
```

## Architecture

- **Framework**: Angular 21.1 with standalone components and signals (no modules)
- **Language**: TypeScript 5.9, strict mode
- **Styling**: SCSS with CSS custom properties (Telegram theme vars + brand palette)
- **State**: Angular signals and `computed()` — no NgRx or external state management
- **Routing**: Flat route table in `src/app/app.routes.ts`
- **i18n**: Custom service in `src/app/i18n/`, 16 languages, RTL support for Arabic
- **Build output**: `dist/xaiworkspace/browser/`

See `Documents/Architecture.md` for the full architecture doc.

## Native Mobile (Capacitor 8)

### iOS

- **Project**: `ios/App/App.xcodeproj`
- **Bundle ID**: `com.xshopper.xaiworkspace`
- **Entitlements**: `ios/App/App/App.entitlements` (Associated Domains, Push Notifications)
- **Info.plist**: Includes `NSFaceIDUsageDescription` for biometric auth
- **Minimum target**: iOS 16+
- **Plugins**: 9 Capacitor plugins (app, browser, haptics, keyboard, preferences, push-notifications, splash-screen, status-bar, native-biometric)

### Android

- **Project**: `android/` (open with Android Studio)
- **Package**: `com.xshopper.xaiworkspace`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 36
- **Gradle**: 8.13.0, AGP via `android/build.gradle`
- **Deep links**: Configured in `AndroidManifest.xml` — universal links for `xaiworkspace.com` + custom scheme `xaiworkspace://oauth`
- **Signing**: `android/keystore.properties` (gitignored) — run `node scripts/google-play-publish.mjs setup-keystore` to generate
- **Publishing**: `scripts/google-play-publish.mjs` handles OAuth, build, and upload to Google Play

### Native Services

| Service | File | Purpose |
|---------|------|---------|
| PlatformService | `services/platform.service.ts` | `isNative`, `isIOS`, `isAndroid`, `isWeb` flags |
| StorageService | `services/storage.service.ts` | `sessionStorage` on web, `@capacitor/preferences` on native |
| PushNotificationService | `services/push-notification.service.ts` | FCM/APNs token registration |
| BiometricService | `services/biometric.service.ts` | Face ID/Touch ID/Fingerprint + keychain |
| DeepLinkService | `services/deep-link.service.ts` | Universal link routing, OAuth callbacks |

### Native OAuth Flow

On native, OAuth uses `@capacitor/browser` (in-app browser) instead of popups. The flow:
1. Open `${routerUrl}/auth/{provider}/start?state=...&redirect=native`
2. Backend redirects to `xaiworkspace://oauth?provider=...&code=...&state=...`
3. `DeepLinkService` receives the URL and calls `AuthService.completeNativeOAuth()`

Telegram login is not available on native — the SDK only works inside the Telegram client.

## Backend Integration

| Service | URL | Protocol |
|---------|-----|----------|
| Chat | `wss://chat.xaiworkspace.com/ws` | WebSocket |
| Router API | `https://router.xaiworkspace.com` | HTTPS REST |

Environment config: `src/environments/environment.ts`

## File Conventions

- **Components**: Standalone, single-file (template + styles inline in `.ts`)
- **Services**: `@Injectable({ providedIn: 'root' })`, use `inject()` function
- **Signals**: Prefer `signal()` and `computed()` over BehaviorSubject
- **Naming**: kebab-case files, PascalCase classes, camelCase methods
- **No modules**: Everything is standalone components with `imports` array

## Sensitive Files (DO NOT commit)

- `android/keystore.properties` — signing keystore config
- `*.keystore`, `*.jks` — signing keystores
- `google-services.json` — Firebase Android config
- `GoogleService-Info.plist` — Firebase iOS config
- `~/.config/xaiworkspace/google-play-token.json` — OAuth refresh token
- `~/.config/xaiworkspace/release.keystore` — release signing keystore

## GDPR Compliance

All compliance documentation is in `Documents/`:
- Audit, DPIA, RoPA, DPA Tracker, Breach Response, Lawful Basis Mapping, TIA, DPO Assessment
- Mobile platform update note added to audit scope (push tokens, biometric, FCM/APNs)
