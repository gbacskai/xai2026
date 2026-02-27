# xAI Workspace — Frontend Architecture

**Last updated:** 2026-02-27

## Overview

xAI Workspace is a multi-platform Angular application that provides AI agent assistance to SME business clients. It is delivered across three channels:

| Channel | Runtime | Auth | Status |
|---------|---------|------|--------|
| Web browser | Angular SPA on AWS Amplify | Google, GitHub, LinkedIn OAuth | Production |
| Telegram WebApp | Angular embedded in Telegram client | Telegram Login Widget | Production |
| iOS / Android | Angular wrapped in Capacitor 8 native shell | Google, GitHub, LinkedIn (via in-app browser) | In development |

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular (standalone components) | 21.1 |
| Language | TypeScript (strict mode) | 5.9 |
| Build system | Angular CLI with Vite | 21.1 |
| Styling | SCSS with CSS custom properties | - |
| Charts | Chart.js + chartjs-plugin-annotation | 4.5 |
| Markdown | marked | 17.x |
| Reactive | RxJS | 7.8 |
| Native shell | Capacitor | 8.1 |
| E2E testing | Playwright | 1.58 |
| Deployment | AWS Amplify (web), Xcode / Android Studio (native) | - |

## Project Structure

```
xaiworkspace/
  capacitor.config.ts          # Capacitor native shell configuration
  angular.json                 # Angular CLI workspace config
  package.json                 # Dependencies and scripts
  src/
    index.html                 # Entry point (viewport-fit=cover for native)
    styles.scss                # Global styles, CSS variables, safe-area insets
    environments/
      environment.ts           # Backend URLs, bot config
    app/
      app.ts                   # Root component — layout, FABs, native init
      app.routes.ts            # Route definitions
      components/
        chat-panel/            # WebSocket chat UI
        agents-panel/          # Agent management sidebar
        back-button/           # Navigation back button
        toast/                 # Toast notification overlay
      pages/
        home/                  # Landing page with auth
        about/                 # About page
        analytics/             # Usage analytics (lazy-loaded)
        article/               # Article detail
        authorize/             # OAuth authorization
        compliance/            # Compliance information
        invite/                # Invite flow
        models/                # AI model selection
        privacy/               # Privacy policy
        purchase-complete/     # Stripe payment callback
        terms/                 # Terms of service
      services/
        auth.service.ts        # Multi-provider OAuth (Telegram, Google, GitHub, LinkedIn)
        chat.service.ts        # WebSocket connection, message handling
        telegram.service.ts    # Telegram WebApp SDK integration
        agents.service.ts      # Agent CRUD and panel state
        toast.service.ts       # Toast notification queue
        platform.service.ts    # Native vs web platform detection
        storage.service.ts     # Cross-platform storage abstraction
        push-notification.service.ts  # FCM/APNs push registration
        biometric.service.ts   # Face ID / fingerprint auth
        deep-link.service.ts   # Universal link and custom scheme routing
      i18n/
        i18n.service.ts        # Language detection and loading
        i18n.types.ts          # Translation key types
        ui/                    # UI string translations (16 languages)
        content/               # Page content translations
          about/               # 16 locale files
          articles/            # 16 locale files
          authorize/           # 16 locale files
          compliance/          # 16 locale files
          privacy/             # 16 locale files
          terms/               # 16 locale files
  ios/                         # Xcode project (Capacitor-generated)
    App/
      App/
        App.entitlements       # Associated domains, push notifications
        Info.plist             # Face ID usage description
  android/                     # Android Studio project (Capacitor-generated)
    app/src/main/
      AndroidManifest.xml      # Deep link intent filters
  Documents/                   # Compliance and architecture docs
  e2e/                         # Playwright E2E tests
```

## Layout Architecture

The app uses a responsive three-panel layout managed by the root `App` component:

```
Desktop (>860px):
+------------------+--------------------+------------------+
|  Content Frame   |   Chat Panel       |  Agents Panel    |
|  (430px, fixed)  |   (860px, center)  |  (350px, fixed)  |
|  Auto-collapses  |   Always visible   |  Toggle sidebar  |
|  after 3 seconds |   when authed      |                  |
+------------------+--------------------+------------------+

Mobile (<=860px):
+------------------------------------------+
|              Content Frame                |
|            (full width, scrollable)       |
+------------------------------------------+
     [Agents FAB]  [Chat FAB]   <- bottom-right
         |               |
         v               v
    Slide-up panel  Slide-up panel
    (65vh height)   (65vh height)
```

- **Content Frame**: Houses the `<router-outlet>` with page content
- **Chat Panel**: WebSocket-connected chat with the AI bot
- **Agents Panel**: Agent management, tips, and configuration

The layout is signal-driven using Angular signals and `computed()`. Panels use CSS `position: fixed` on desktop and `transform: translateY()` slide-up animations on mobile.

## Service Architecture

### Core Services

```
                            +-------------------+
                            |   App Component   |
                            +-------------------+
                                    |
         +----------+----------+----+----+----------+---------+
         |          |          |         |          |         |
    TelegramSvc  AuthSvc   ChatSvc  AgentsSvc  I18nSvc  PlatformSvc
         |          |          |
         |     StorageSvc  StorageSvc
         |
    Haptics (native fallback)
```

### Native Services (Capacitor)

```
App.initNative()
    |
    +-- StatusBar.setStyle()         # Status bar appearance
    +-- SplashScreen.hide()          # Hide launch splash
    +-- DeepLinkService.init()       # Universal link listener
    +-- BiometricService.init()      # Check biometric availability
    +-- PushNotificationService.init()  # Request permission, register
    +-- Keyboard listener (iOS)      # --keyboard-height CSS var
    +-- CapApp.appStateChange         # Biometric lock on resume
```

### Platform Detection

`PlatformService` wraps `Capacitor.isNativePlatform()` and `Capacitor.getPlatform()` to provide boolean flags consumed throughout the app:

| Property | Type | Description |
|----------|------|-------------|
| `isNative` | `boolean` | `true` on iOS or Android |
| `isWeb` | `boolean` | `true` in browser |
| `isIOS` | `boolean` | `true` on iOS only |
| `isAndroid` | `boolean` | `true` on Android only |
| `platform` | `string` | `'ios'`, `'android'`, or `'web'` |

### Storage Abstraction

`StorageService` provides a unified API across platforms:

| Platform | Backend | Persistence |
|----------|---------|-------------|
| Web | `sessionStorage` / `localStorage` | Tab lifetime / permanent |
| Native | `@capacitor/preferences` | Permanent (survives app restart) |

This replaces direct `sessionStorage` calls in `AuthService` and `ChatService`, solving the native issue where `sessionStorage` is cleared on app restart.

## Authentication

### Supported Providers

| Provider | Web Flow | Native Flow |
|----------|----------|-------------|
| Google | `google.accounts.oauth2` popup | In-app browser via `@capacitor/browser` |
| GitHub | Popup window + `storage` event | In-app browser + deep link callback |
| LinkedIn | Popup window + `storage` event | In-app browser + deep link callback |
| Telegram | `Telegram.Login.auth()` widget | Not available (skipped on native) |

### Native OAuth Flow

1. `AuthService.loginWith{Provider}()` detects native platform
2. Generates CSRF `state` token, stores in `StorageService`
3. Opens `${routerUrl}/auth/{provider}/start?state=...&redirect=native` via `@capacitor/browser`
4. Backend redirects to `xaiworkspace://oauth?provider=...&code=...&state=...`
5. `DeepLinkService` receives the URL via `App.addListener('appUrlOpen')`
6. Calls `AuthService.completeNativeOAuth()` which validates state and stores the user
7. Closes the in-app browser

### Session Persistence

- **Web**: `sessionStorage` (lost on tab close — by design)
- **Native**: `@capacitor/preferences` (persists across app restarts)
- **Biometric**: Session token optionally stored in native keychain via `NativeBiometric.setCredentials()`

## Real-Time Communication

The `ChatService` manages a WebSocket connection to `wss://chat.xaiworkspace.com/ws`:

```
Client                          Server
  |--- auth (provider + code) --->|
  |<-- auth_ok (sessionToken) ----|
  |--- message (text) ----------->|
  |<-- message (bot response) ----|
  |<-- token_refresh -------------|
  |--- callback (button data) --->|
  |--- link (provider binding) -->|
  |<-- link_code / link_success --|
```

Features:
- Automatic reconnect with exponential backoff (max 5 attempts)
- Message queue for offline sends (replayed on reconnect)
- Session token reconnect (skip full OAuth on reconnect)
- Multi-account session switching
- 500-message rolling buffer

## Internationalization

16 languages supported via a custom i18n system (`I18nService`):

`ar`, `de`, `en`, `es`, `fr`, `hi`, `hu`, `id`, `it`, `ja`, `ko`, `nl`, `pt-BR`, `ru`, `tr`, `zh`

- UI strings: `src/app/i18n/ui/{locale}.ts`
- Page content: `src/app/i18n/content/{page}/{locale}.ts`
- RTL support for Arabic (`[dir="rtl"]` CSS rules)
- Language auto-detected from browser/Telegram settings

## Capacitor Native Shell

### Configuration (`capacitor.config.ts`)

```
App ID:     com.xshopper.xaiworkspace
App Name:   xAI Workspace
Web Dir:    dist/xaiworkspace/browser
Schemes:    https (both iOS and Android)
```

### Capacitor Plugins (9)

| Plugin | Purpose |
|--------|---------|
| `@capacitor/app` | App lifecycle events, deep link listener |
| `@capacitor/browser` | In-app browser for native OAuth |
| `@capacitor/haptics` | Haptic feedback (extends Telegram haptics to native) |
| `@capacitor/keyboard` | Keyboard show/hide events, height tracking |
| `@capacitor/preferences` | Persistent key-value storage |
| `@capacitor/push-notifications` | FCM (Android) / APNs (iOS) push registration |
| `@capacitor/splash-screen` | Launch splash screen control |
| `@capacitor/status-bar` | Status bar style and color |
| `@capgo/capacitor-native-biometric` | Face ID / Touch ID / Fingerprint + keychain |

### Deep Links

**iOS** (Universal Links):
- `applinks:xaiworkspace.com` and `applinks:router.xaiworkspace.com` in `App.entitlements`
- Requires `/.well-known/apple-app-site-association` hosted on web server

**Android** (App Links + Custom Scheme):
- `https://xaiworkspace.com/*` intent filter with `android:autoVerify="true"`
- `xaiworkspace://oauth` custom scheme for OAuth callbacks
- Requires `/.well-known/assetlinks.json` hosted on web server

### Safe Area Handling

CSS custom properties ensure content avoids hardware intrusions:

```scss
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
  --keyboard-height: 0px;  // Updated dynamically on iOS
}
```

The `viewport-fit=cover` meta tag enables full-screen rendering behind the notch/Dynamic Island.

## Build and Deploy

### Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server at `localhost:4200` |
| `npm run build` | Production Angular build |
| `npm run build:mobile` | Production build + `cap sync` |
| `npm run cap:sync` | Sync web assets to native projects |
| `npm run open:ios` | Build, sync, and open Xcode |
| `npm run open:android` | Build, sync, and open Android Studio |
| `npm run e2e` | Run Playwright E2E tests |

### Build Pipeline

```
ng build --configuration production
    |
    v
dist/xaiworkspace/browser/     # Static web assets
    |
    +-- cap sync ios            # Copy to ios/App/App/public/
    +-- cap sync android        # Copy to android/app/src/main/assets/public/
    |
    +-- Xcode Archive           # .ipa for App Store
    +-- Android Studio AAB      # .aab for Google Play
```

### Web Deployment

AWS Amplify auto-deploys from the `master` branch. Configuration in `amplify.yml`.

### Mobile Distribution

| Platform | Tool | Target |
|----------|------|--------|
| iOS | Xcode Archive -> App Store Connect | App Store |
| Android | Android Studio signed AAB | Google Play Console |

## Backend Integration

The frontend communicates with two backend services:

| Service | URL | Protocol |
|---------|-----|----------|
| Chat server | `wss://chat.xaiworkspace.com/ws` | WebSocket |
| Router API | `https://router.xaiworkspace.com` | HTTPS REST |

### Router API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /config` | Fetch Google Client ID |
| `GET /auth/{provider}/start` | Initiate OAuth flow |
| `POST /api/restart` | Restart user's AI instance |
| `POST /api/stop` | Stop user's AI instance |
| `POST /api/push-token` | Register device push token (native) |

## GDPR Compliance

Full compliance documentation is maintained in `Documents/`:

- `GDPR-Audit-2026-02-22.md` — Comprehensive audit with 44+ findings
- `GDPR-DPIA.md` — Data Protection Impact Assessment
- `GDPR-Transfer-Impact-Assessment.md` — TIA for Anthropic (US) transfers
- `GDPR-DPA-Tracker.md` — Data Processing Agreement status register
- `GDPR-RoPA.md` — Records of Processing Activities (11 activities)
- `GDPR-Lawful-Basis-Mapping.md` — Lawful basis and Legitimate Interest Assessments
- `GDPR-DPO-Assessment.md` — DPO necessity assessment
- `GDPR-Breach-Response-Plan.md` — Incident response procedures
