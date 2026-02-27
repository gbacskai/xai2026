#!/usr/bin/env node

/**
 * Google Play Publisher Script
 *
 * Builds the Angular app, assembles an Android App Bundle (AAB),
 * authenticates via OAuth2, and uploads to Google Play internal track.
 *
 * Prerequisites:
 *   1. App "xAIWorkspace" (com.xshopper.xaiworkspace) created in Google Play Console
 *   2. Google Play Android Developer API enabled in Google Cloud Console
 *   3. OAuth consent screen configured with scope: androidpublisher
 *   4. Environment variables set:
 *      - GOOGLE_PLAY_CLIENT_ID
 *      - GOOGLE_PLAY_CLIENT_SECRET
 *   5. Android SDK + Gradle available (or use Android Studio to build)
 *   6. Keystore for signing (see --setup-keystore)
 *
 * Usage:
 *   node scripts/google-play-publish.mjs auth          # One-time OAuth login, saves refresh token
 *   node scripts/google-play-publish.mjs build         # Build AAB only
 *   node scripts/google-play-publish.mjs publish       # Build + upload to internal track
 *   node scripts/google-play-publish.mjs upload        # Upload existing AAB (skip build)
 *   node scripts/google-play-publish.mjs setup-keystore # Generate release signing keystore
 */

import { execSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createSign } from 'node:crypto';

// ── Config ──────────────────────────────────────────────────────────────────

const PACKAGE_NAME = 'com.xshopper.xaiworkspace';
const APP_NAME = 'xAIWorkspace';
const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const ANDROID_DIR = join(PROJECT_ROOT, 'android');
const AAB_PATH = join(ANDROID_DIR, 'app/build/outputs/bundle/release/app-release.aab');
const TOKEN_PATH = join(homedir(), '.config', 'xaiworkspace', 'google-play-token.json');
const KEYSTORE_PATH = join(homedir(), '.config', 'xaiworkspace', 'release.keystore');
const KEYSTORE_PROPS_PATH = join(ANDROID_DIR, 'keystore.properties');

const SERVICE_ACCOUNT_PATH = join(homedir(), '.config', 'xaiworkspace', 'xaiworkspace-c7e88e486380.json');

const CLIENT_ID = process.env.GOOGLE_PLAY_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_PLAY_CLIENT_SECRET;
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const REDIRECT_PORT = 8085;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

const API_BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

// ── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}\n`);
  return execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, ...opts });
}

function ensureDir(filepath) {
  const dir = filepath.substring(0, filepath.lastIndexOf('/'));
  execSync(`mkdir -p "${dir}"`);
}

function log(msg) {
  console.log(`[${APP_NAME}] ${msg}`);
}

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

// ── Service Account JWT Auth ─────────────────────────────────────────────────

function loadServiceAccount() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function base64url(data) {
  return Buffer.from(data).toString('base64url');
}

async function getServiceAccountToken() {
  const sa = loadServiceAccount();
  if (!sa) die(`Service account key not found at ${SERVICE_ACCOUNT_PATH}`);

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    die(`Service account token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── OAuth2 ──────────────────────────────────────────────────────────────────

function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    die(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    die(`Token refresh failed: ${res.status} ${text}. Run: node scripts/google-play-publish.mjs auth`);
  }
  return res.json();
}

function saveToken(tokenData) {
  ensureDir(TOKEN_PATH);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
  log(`Token saved to ${TOKEN_PATH}`);
}

function loadToken() {
  if (!existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

async function getAccessToken() {
  // Prefer service account if available
  const sa = loadServiceAccount();
  if (sa) {
    log('Using service account authentication...');
    return getServiceAccountToken();
  }

  // Fall back to OAuth2
  log('Using OAuth2 authentication...');
  const stored = loadToken();
  if (!stored?.refresh_token) {
    die('No refresh token or service account found. Run: node scripts/google-play-publish.mjs auth');
  }
  const data = await refreshAccessToken(stored.refresh_token);
  // Preserve refresh token (Google doesn't always return it on refresh)
  const merged = { ...stored, ...data };
  saveToken(merged);
  return merged.access_token;
}

async function doAuth() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    die('Set GOOGLE_PLAY_CLIENT_ID and GOOGLE_PLAY_CLIENT_SECRET environment variables.');
  }

  const authUrl = getAuthUrl();
  log('Opening browser for Google OAuth...');
  log(`If the browser doesn't open, visit:\n${authUrl}\n`);

  // Try to open browser
  try {
    const openCmd =
      process.platform === 'darwin' ? 'open' :
      process.platform === 'win32' ? 'start' : 'xdg-open';
    execSync(`${openCmd} "${authUrl}"`, { stdio: 'ignore' });
  } catch {
    // User will manually navigate
  }

  // Start local HTTP server to receive the OAuth callback
  return new Promise((resolvePromise) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authorization failed</h1><p>${error}</p>`);
        server.close();
        die(`OAuth error: ${error}`);
        return;
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authorization successful!</h1><p>You can close this tab and return to the terminal.</p>`);

        log('Exchanging code for tokens...');
        const tokenData = await exchangeCode(code);
        saveToken(tokenData);
        log('Authentication complete!');

        server.close();
        resolvePromise();
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing code parameter');
      }
    });

    server.listen(REDIRECT_PORT, () => {
      log(`Listening for OAuth callback on http://localhost:${REDIRECT_PORT}...`);
    });
  });
}

// ── Keystore Setup ──────────────────────────────────────────────────────────

function doSetupKeystore() {
  if (existsSync(KEYSTORE_PATH)) {
    log(`Keystore already exists at ${KEYSTORE_PATH}`);
    log('Delete it first if you want to regenerate.');
    return;
  }

  ensureDir(KEYSTORE_PATH);
  log('Generating release signing keystore...');

  const keyPath = KEYSTORE_PATH.replace('.keystore', '.key');
  const certPath = KEYSTORE_PATH.replace('.keystore', '.pem');
  const storePass = 'xaiworkspace';

  // Generate RSA key + self-signed cert with OpenSSL (no Java/keytool needed)
  run(
    `openssl req -newkey rsa:2048 -nodes -keyout "${keyPath}" ` +
    `-x509 -days 10000 -out "${certPath}" ` +
    `-subj "/CN=xAI Workspace/OU=Mobile/O=xShopper Pty Ltd/L=Sydney/ST=NSW/C=AU"`,
  );

  // Package into PKCS12 keystore (Gradle accepts PKCS12 just like JKS)
  run(
    `openssl pkcs12 -export -in "${certPath}" -inkey "${keyPath}" ` +
    `-out "${KEYSTORE_PATH}" -name "${APP_NAME}" ` +
    `-password pass:${storePass}`,
  );

  // Clean up intermediate files
  execSync(`rm -f "${keyPath}" "${certPath}"`);

  // Write keystore.properties for Gradle
  const props = [
    `storeFile=${KEYSTORE_PATH}`,
    `storePassword=${storePass}`,
    `keyAlias=${APP_NAME}`,
    `keyPassword=${storePass}`,
  ].join('\n');
  writeFileSync(KEYSTORE_PROPS_PATH, props + '\n', 'utf-8');
  log(`Keystore created at ${KEYSTORE_PATH}`);
  log(`Keystore properties written to ${KEYSTORE_PROPS_PATH}`);
  log('IMPORTANT: Change the default passwords before production use!');
  log('IMPORTANT: Back up this keystore! You cannot update your app without it.');
}

// ── Build ───────────────────────────────────────────────────────────────────

function doBuild() {
  log('Building Angular app for production...');
  run('npx ng build --configuration production');

  log('Syncing Capacitor...');
  run('npx cap sync android');

  // Check if signing config exists
  if (existsSync(KEYSTORE_PROPS_PATH)) {
    log('Signing config found. Building signed release AAB...');
  } else {
    log('No keystore.properties found. Building unsigned release AAB...');
    log('Run: node scripts/google-play-publish.mjs setup-keystore');
  }

  log('Building Android App Bundle...');
  const gradlew = join(ANDROID_DIR, 'gradlew');
  run(`"${gradlew}" bundleRelease`, { cwd: ANDROID_DIR });

  if (!existsSync(AAB_PATH)) {
    die(`AAB not found at ${AAB_PATH}. Check the Gradle build output.`);
  }

  const size = (statSync(AAB_PATH).size / 1024 / 1024).toFixed(1);
  log(`AAB built: ${AAB_PATH} (${size} MB)`);
}

// ── Upload ──────────────────────────────────────────────────────────────────

async function doUpload(track = 'internal') {
  if (!existsSync(AAB_PATH)) {
    die(`AAB not found at ${AAB_PATH}. Run 'build' first.`);
  }

  const accessToken = await getAccessToken();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Step 1: Create a new edit
  log('Creating new edit...');
  let res = await fetch(`${API_BASE}/${PACKAGE_NAME}/edits`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    die(`Failed to create edit: ${res.status} ${text}`);
  }
  const edit = await res.json();
  const editId = edit.id;
  log(`Edit created: ${editId}`);

  // Step 2: Upload AAB
  log(`Uploading AAB to ${track} track...`);
  const aabData = readFileSync(AAB_PATH);
  const size = (aabData.length / 1024 / 1024).toFixed(1);
  log(`Uploading ${size} MB...`);

  res = await fetch(
    `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE_NAME}/edits/${editId}/bundles?uploadType=media`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(aabData.length),
      },
      body: aabData,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    die(`Upload failed: ${res.status} ${text}`);
  }
  const bundle = await res.json();
  const versionCode = bundle.versionCode;
  log(`AAB uploaded. Version code: ${versionCode}`);

  // Step 3: Assign to track
  const releaseStatus = process.argv.includes('--draft') ? 'draft' : 'completed';
  log(`Assigning to ${track} track (status: ${releaseStatus})...`);
  res = await fetch(
    `${API_BASE}/${PACKAGE_NAME}/edits/${editId}/tracks/${track}`,
    {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        track,
        releases: [
          {
            versionCodes: [String(versionCode)],
            status: releaseStatus,
            releaseNotes: [
              {
                language: 'en-US',
                text: `xAI Workspace v${bundle.versionCode} — AI agent workspace for SME business clients.`,
              },
            ],
          },
        ],
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    die(`Track assignment failed: ${res.status} ${text}`);
  }
  log(`Assigned to ${track} track.`);

  // Step 4: Commit the edit
  log('Committing edit...');
  res = await fetch(`${API_BASE}/${PACKAGE_NAME}/edits/${editId}:commit`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    die(`Commit failed: ${res.status} ${text}`);
  }
  log(`Published to ${track} track successfully!`);
  log(`View in Play Console: https://play.google.com/console/u/0/developers/apps/${PACKAGE_NAME}/tracks/${track}`);
}

// ── Gradle Signing Config ───────────────────────────────────────────────────

function ensureGradleSigning() {
  const buildGradle = join(ANDROID_DIR, 'app/build.gradle');
  const content = readFileSync(buildGradle, 'utf-8');

  if (content.includes('signingConfigs')) {
    return; // Already configured
  }

  if (!existsSync(KEYSTORE_PROPS_PATH)) {
    return; // No keystore yet
  }

  log('Adding signing config to app/build.gradle...');
  const signingBlock = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;
  const signingConfigs = `
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`;
  const buildTypeSigning = '            signingConfig signingConfigs.release';

  let updated = signingBlock + content;
  updated = updated.replace(
    'android {',
    `android {\n${signingConfigs}`,
  );
  updated = updated.replace(
    'release {\n            minifyEnabled false',
    `release {\n${buildTypeSigning}\n            minifyEnabled false`,
  );

  writeFileSync(buildGradle, updated, 'utf-8');
  log('Signing config added to build.gradle.');
}

// ── Version Bump ────────────────────────────────────────────────────────────

function bumpVersionCode() {
  const buildGradle = join(ANDROID_DIR, 'app/build.gradle');
  const content = readFileSync(buildGradle, 'utf-8');
  const match = content.match(/versionCode\s+(\d+)/);
  if (!match) return;

  const current = parseInt(match[1], 10);
  const next = current + 1;
  const updated = content.replace(/versionCode\s+\d+/, `versionCode ${next}`);
  writeFileSync(buildGradle, updated, 'utf-8');
  log(`Version code bumped: ${current} → ${next}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

const command = process.argv[2];

if (!command || command === 'help' || command === '--help') {
  console.log(`
Google Play Publisher for ${APP_NAME}

Usage:
  node scripts/google-play-publish.mjs <command>

Commands:
  auth             Authenticate with Google (one-time, opens browser)
  setup-keystore   Generate a release signing keystore
  build            Build Angular + Android AAB
  upload           Upload existing AAB to internal track
  publish          Build + upload in one step
  bump             Bump versionCode in build.gradle
  help             Show this help
`);
  process.exit(0);
}

switch (command) {
  case 'auth':
    await doAuth();
    break;

  case 'setup-keystore':
    doSetupKeystore();
    break;

  case 'build':
    ensureGradleSigning();
    doBuild();
    break;

  case 'upload': {
    const trackArg = process.argv.slice(3).find(a => !a.startsWith('--')) || 'internal';
    await doUpload(trackArg);
    break;
  }

  case 'publish': {
    ensureGradleSigning();
    bumpVersionCode();
    doBuild();
    const trackArg2 = process.argv.slice(3).find(a => !a.startsWith('--')) || 'internal';
    await doUpload(trackArg2);
    break;
  }

  case 'bump':
    bumpVersionCode();
    break;

  default:
    die(`Unknown command: ${command}. Run with 'help' for usage.`);
}
