# CI/CD Pipeline — Frontend & Mobile

AWS-native CI/CD for xAI Workspace: web (Amplify), Android (Google Play), iOS (App Store).

## Architecture

### Web (Amplify)

```
CodeCommit (xaiworkspace-frontend, master)
  → Amplify auto-build+deploy
  → xaiworkspace.com
```

### Mobile (CodePipeline)

```
CodeCommit (xaiworkspace-frontend, release/*)
  → CodePipeline (openclaw-sme-mobile)
    → Playwright E2E (CodeBuild Linux)
    → Android Build (CodeBuild Linux) — AAB + debug APK
    → iOS Build (CodeBuild macOS) — xcodebuild + Fastlane → TestFlight
    → Device Farm (fuzz + browser smoke)
    → Manual Approve
    → Google Play upload (internal track)
    → App Store submission (Fastlane deliver)
```

## Setup

### Prerequisites

- AWS CLI v2 with profile `aws_amplify_docflow4`
- Backend pipeline already set up (shared IAM roles, S3 buckets, SNS topic)
- Secrets stored in Secrets Manager (see below)

### Steps

```bash
# 1. Ensure shared resources exist (run from backend repo)
../OpenClaw-SME/cicd/setup-backend-pipeline.sh

# 2. Store secrets in Secrets Manager
# See "Secrets" section below

# 3. Create mobile pipeline (idempotent)
./cicd/setup-mobile-pipeline.sh

# 4. Reconnect Amplify to CodeCommit (manual — AWS Console)

# 5. Initialize Fastlane Match (one-time)
cd cicd/Fastlane && fastlane match init --storage_mode s3

# 6. Push to release/* branch to trigger mobile pipeline
git checkout -b release/v1.1
git push codecommit release/v1.1
```

## CodeBuild Projects

| Project | Buildspec | Environment | Purpose |
|---|---|---|---|
| `openclaw-sme-frontend-playwright` | `buildspec-frontend-playwright.yml` | Linux ARM | Playwright E2E tests |
| `openclaw-sme-android-build` | `buildspec-android-build.yml` | Linux ARM | Angular + Capacitor + Gradle |
| `openclaw-sme-ios-build` | `buildspec-ios-build.yml` | macOS ARM | xcodebuild + Fastlane TestFlight |
| `openclaw-sme-devicefarm-test` | `buildspec-devicefarm.yml` | Linux ARM | Device Farm fuzz + browser |
| `openclaw-sme-gplay-publish` | `buildspec-gplay-publish.yml` | Linux ARM | Google Play internal track |
| `openclaw-sme-appstore-publish` | `buildspec-ios-publish.yml` | macOS ARM | App Store submission |

## Secrets (Secrets Manager)

| Secret ID | Keys | Used by |
|---|---|---|
| `openclaw-sme/android-signing` | KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD | Android build |
| `openclaw-sme/google-play` | SERVICE_ACCOUNT_JSON | Google Play upload |
| `openclaw-sme/appstore-connect` | APP_STORE_CONNECT_API_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_KEY_BASE64 | iOS build + publish |
| `openclaw-sme/fastlane-match` | MATCH_PASSWORD | Fastlane Match (certificate encryption) |

## Fastlane

### Match (Certificate Management)

Certificates and provisioning profiles are stored encrypted in S3 (`openclaw-sme-fastlane-match`).

```bash
# Initialize (one-time)
fastlane match init --storage_mode s3

# Fetch certificates (CI — read-only)
fastlane match appstore --readonly

# Create/renew certificates (local only)
fastlane match appstore
```

### Lanes

| Lane | Purpose |
|---|---|
| `ios ci_upload` | Build IPA + upload to TestFlight |
| `ios ci_release` | Submit latest TestFlight build to App Store |

Config: `cicd/Fastlane/Fastfile` (CI lanes), `fastlane/Fastfile` (local lanes).

## Amplify Reconnection

To reconnect Amplify from GitHub to CodeCommit:

1. AWS Console → Amplify → xaiworkspace app
2. App settings → General → Disconnect repository
3. Reconnect → CodeCommit → `xaiworkspace-frontend` → branch `master`
4. Build settings remain unchanged (`amplify.yml`)

## Cost

| Service | Cost | Notes |
|---|---|---|
| CodePipeline | $1/mo | 1 pipeline |
| CodeBuild (Linux) | ~$2/mo | Playwright + Android + Device Farm |
| CodeBuild (macOS) | ~$25–50/mo | 24hr min allocation at $0.65/hr |
| Amplify | Free tier | Small site, low traffic |
| Device Farm | Free tier | 250 device-min/mo |

**Cost tip:** Batch iOS changes — push all iOS work together on a single `release/*` branch to minimize macOS build minutes.
