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
npm run gplay:metadata       # Upload store listings + graphics to Google Play
npm run devicefarm           # Build APK + fuzz test on real Android devices
npm run devicefarm:ios       # Build IPA + fuzz test on real iOS 16+ devices
npm run devicefarm:browser   # Smoke tests on Device Farm desktop browsers (Chrome + Firefox)
npm run devicefarm:chrome    # Desktop browser tests (Chrome only)
npm run devicefarm:firefox   # Desktop browser tests (Firefox only)
npm run appstore:metadata    # Upload App Store listings via fastlane
npm run appstore:upload      # Build IPA + upload to TestFlight
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

## Google Play Store Listing

Store metadata lives in `fastlane/metadata/android/{locale}/` with 16 locales. Key files:
- `title.txt`, `short_description.txt`, `full_description.txt`, `changelogs/{versionCode}.txt`
- `en-US/images/featureGraphic.png` (1024x500), `icon.png` (512x512)
- `public/privacy.html` — static privacy policy (no JS, required by Google Play)

Scripts: `scripts/google-play-metadata.mjs` (upload), `scripts/generate-feature-graphic.mjs` (graphics)

## App Store (iOS)

Store metadata lives in `fastlane/metadata/ios/{locale}/` with 16 locales (Apple locale codes).
Key files per locale: `name.txt`, `subtitle.txt`, `description.txt`, `keywords.txt`, `promotional_text.txt`, `release_notes.txt`, `privacy_url.txt`, `support_url.txt`, `marketing_url.txt`

Fastlane lanes: `fastlane ios metadata` (upload listings), `fastlane ios upload` (build + TestFlight), `fastlane ios release` (submit for review)

## Testing (AWS Device Farm)

| Type | Script | What it does |
|------|--------|-------------|
| Android fuzz | `scripts/device-farm-test.mjs` | Builds debug APK, uploads to Device Farm, runs 6000 random UI events on Android 9+ real devices |
| iOS fuzz | `scripts/device-farm-ios.mjs` | Builds unsigned IPA, uploads to Device Farm, runs 6000 random UI events on iOS 16+ real devices |
| Desktop browser | `scripts/device-farm-browser.mjs` | 45 public + 20 auth Selenium tests on Chrome + Firefox via Device Farm test grid |

AWS profile: `aws_amplify_docflow4`, region: `us-west-2`

## CI/CD Pipeline

**Source:** CodeCommit `xaiworkspace-frontend`. GitHub retired as source.

**Web (Amplify):** Auto-build on push to `master` → deploys to xaiworkspace.com. Config: `amplify.yml`.

**Mobile (CodePipeline):** `openclaw-sme-mobile` — triggered on push to `release/*` branches:
1. **Playwright E2E** — chromium, firefox, mobile-chrome (CodeBuild Linux)
2. **Android Build** — Angular + Capacitor + Gradle → AAB + debug APK (CodeBuild Linux)
3. **iOS Build** — xcodebuild + Fastlane → TestFlight upload (CodeBuild macOS ARM)
4. **Device Farm** — Android fuzz + browser smoke tests
5. **Manual Approve** — Review TestFlight build + Device Farm results
6. **Google Play** — AAB → internal track via service account
7. **App Store** — Fastlane deliver → submission for review

**Setup:**
```bash
./cicd/setup-mobile-pipeline.sh     # create pipeline (idempotent)
```

**Fastlane Match:** Certificates stored encrypted in S3 (`openclaw-sme-fastlane-match`). Config: `cicd/Fastlane/Matchfile`.

**CI files:** `buildspec-*.yml` (6 buildspecs), `cicd/setup-mobile-pipeline.sh`, `cicd/Fastlane/` (Fastfile + Matchfile), `cicd/README.md`.

**Device Farm scripts** (`scripts/device-farm-*.mjs`): Use IAM role in CI (`process.env.CI`), local AWS profile otherwise.

## GDPR Compliance

All compliance documentation is in `Documents/`:
- Audit, DPIA, RoPA, DPA Tracker, Breach Response, Lawful Basis Mapping, TIA, DPO Assessment
- Mobile platform update note added to audit scope (push tokens, biometric, FCM/APNs)
