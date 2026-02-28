#!/usr/bin/env node

/**
 * AWS Device Farm Test Runner
 *
 * Builds a debug APK, uploads to Device Farm, and schedules a test run
 * on real Android devices.
 *
 * Prerequisites:
 *   1. AWS CLI configured with profile aws_amplify_docflow4
 *   2. Device Farm permissions (run scripts/device-farm-iam-setup.sh)
 *   3. Android SDK + Gradle (or Android Studio)
 *
 * Usage:
 *   node scripts/device-farm-test.mjs                 # Build + upload + run fuzz test
 *   node scripts/device-farm-test.mjs --upload-only   # Upload APK without running tests
 *   node scripts/device-farm-test.mjs --status <arn>  # Check status of a run
 *   node scripts/device-farm-test.mjs --list-runs     # List recent test runs
 *   node scripts/device-farm-test.mjs --list-pools    # List available device pools
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// ── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ARN = 'arn:aws:devicefarm:us-west-2:695829630004:project:34d45d4e-2bd1-4a07-b217-e8796c1b4802';
const AWS_PROFILE = process.env.CI ? '' : 'aws_amplify_docflow4';
const AWS_REGION = 'us-west-2';
const PROJECT_ROOT = resolve(import.meta.dirname, '..');
const ANDROID_DIR = join(PROJECT_ROOT, 'android');
const APK_PATH = join(ANDROID_DIR, 'app/build/outputs/apk/debug/app-debug.apk');
const AAB_PATH = join(ANDROID_DIR, 'app/build/outputs/bundle/release/app-release.aab');

// Default test device: Pixel-class device with recent Android
const DEFAULT_DEVICE_POOL_NAME = 'xAIWorkspace-TestDevices';

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[device-farm] ${msg}`); }
function die(msg) { console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

function aws(command) {
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';
  const fullCmd = `aws ${command} ${profileFlag} --region ${AWS_REGION} --output json`;
  try {
    const result = execSync(fullCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(result);
  } catch (err) {
    const stderr = err.stderr?.toString() || '';
    if (stderr.includes('UnrecognizedClientException') || stderr.includes('AccessDeniedException')) {
      die(`AWS auth failed. Check profile "${AWS_PROFILE}" and Device Farm permissions.\n${stderr}`);
    }
    throw err;
  }
}

function awsRaw(command) {
  const fullCmd = `aws ${command} --profile ${AWS_PROFILE} --region ${AWS_REGION}`;
  return execSync(fullCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}\n`);
  return execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, ...opts });
}

// ── Find or Build App ───────────────────────────────────────────────────────

function findExistingArtifact() {
  // Prefer existing APK, then AAB
  if (existsSync(APK_PATH)) return { path: APK_PATH, type: 'ANDROID_APP', name: 'app-debug.apk' };
  if (existsSync(AAB_PATH)) return { path: AAB_PATH, type: 'ANDROID_APP', name: 'app-release.aab' };
  return null;
}

function buildApk() {
  log('Building Angular app for production...');
  run('npx ng build --configuration production');

  log('Syncing Capacitor...');
  run('npx cap sync android');

  log('Building debug APK for Device Farm...');
  const gradlew = join(ANDROID_DIR, 'gradlew');
  run(`"${gradlew}" assembleDebug`, { cwd: ANDROID_DIR });

  if (!existsSync(APK_PATH)) {
    die(`APK not found at ${APK_PATH}. Check the Gradle build output.`);
  }

  const size = (readFileSync(APK_PATH).length / 1024 / 1024).toFixed(1);
  log(`APK built: ${APK_PATH} (${size} MB)`);
  return { path: APK_PATH, type: 'ANDROID_APP', name: 'app-debug.apk' };
}

// ── Upload to Device Farm ───────────────────────────────────────────────────

function uploadApk({ path: apkPath, type, name }) {
  log(`Creating upload in Device Farm (${name})...`);

  const upload = aws(
    `devicefarm create-upload --project-arn "${PROJECT_ARN}" --name "${name}" --type ${type}`
  );

  const uploadArn = upload.upload.arn;
  const presignedUrl = upload.upload.url;

  log(`Upload ARN: ${uploadArn}`);
  log('Uploading APK to Device Farm...');

  // Use curl for presigned URL upload (aws cli doesn't handle this directly)
  execSync(`curl -sS -T "${apkPath}" "${presignedUrl}"`, { stdio: 'inherit' });

  // Poll until upload processing completes
  log('Waiting for upload processing...');
  let status = 'PROCESSING';
  while (status === 'INITIALIZED' || status === 'PROCESSING') {
    const check = aws(`devicefarm get-upload --arn "${uploadArn}"`);
    status = check.upload.status;
    if (status === 'FAILED') {
      die(`Upload processing failed: ${check.upload.message || 'unknown error'}`);
    }
    if (status !== 'SUCCEEDED') {
      execSync('sleep 3');
    }
  }

  log('Upload processed successfully!');
  return uploadArn;
}

// ── Device Pool ─────────────────────────────────────────────────────────────

function getOrCreateDevicePool() {
  // Check for existing pools
  const pools = aws(`devicefarm list-device-pools --arn "${PROJECT_ARN}" --type PRIVATE`);

  const existing = pools.devicePools?.find((p) => p.name === DEFAULT_DEVICE_POOL_NAME);
  if (existing) {
    log(`Using existing device pool: ${existing.name} (${existing.arn})`);
    return existing.arn;
  }

  // Create a device pool: modern Android devices (API 28+, i.e. Android 9+)
  log(`Creating device pool: ${DEFAULT_DEVICE_POOL_NAME}...`);

  // Write rules to temp file to avoid shell quoting issues with nested JSON strings
  const rules = [
    { attribute: 'OS_VERSION', operator: 'GREATER_THAN_OR_EQUALS', value: '"9"' },
    { attribute: 'PLATFORM', operator: 'EQUALS', value: '"ANDROID"' },
  ];
  const rulesFile = join(tmpdir(), 'devicefarm-rules.json');
  writeFileSync(rulesFile, JSON.stringify(rules), 'utf-8');

  let pool;
  try {
    pool = aws(
      `devicefarm create-device-pool --project-arn "${PROJECT_ARN}" ` +
      `--name "${DEFAULT_DEVICE_POOL_NAME}" ` +
      `--description "Android 9+ devices for xAI Workspace testing" ` +
      `--rules file://${rulesFile} ` +
      `--max-devices 5`
    );
  } finally {
    try { unlinkSync(rulesFile); } catch {}
  }

  log(`Device pool created: ${pool.devicePool.arn}`);
  return pool.devicePool.arn;
}

// ── Schedule Test Run ───────────────────────────────────────────────────────

function scheduleRun(uploadArn, devicePoolArn) {
  log('Scheduling test run (built-in fuzz test)...');

  // Use built-in fuzz testing — exercises the app with random UI events,
  // good for catching crashes, ANRs, and basic compatibility issues.
  const result = aws(
    `devicefarm schedule-run ` +
    `--project-arn "${PROJECT_ARN}" ` +
    `--app-arn "${uploadArn}" ` +
    `--device-pool-arn "${devicePoolArn}" ` +
    `--name "xAIWorkspace-fuzz-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}" ` +
    `--test '{"type":"BUILTIN_FUZZ","parameters":{"event_count":"6000","throttle":"50","seed":"1234"}}'`
  );

  const runArn = result.run.arn;
  log(`Test run scheduled!`);
  log(`Run ARN: ${runArn}`);
  log(`Status: ${result.run.status}`);
  log('');
  log(`Check status:  node scripts/device-farm-test.mjs --status "${runArn}"`);
  log(`List runs:     node scripts/device-farm-test.mjs --list-runs`);
  log(`Console:       https://us-west-2.console.aws.amazon.com/devicefarm/home?region=us-west-2#/projects/${PROJECT_ARN.split(':').pop()}/runs`);

  return runArn;
}

// ── Status & Listing ────────────────────────────────────────────────────────

function checkStatus(runArn) {
  const result = aws(`devicefarm get-run --arn "${runArn}"`);
  const r = result.run;

  log(`Run: ${r.name}`);
  log(`Status: ${r.status}`);
  log(`Result: ${r.result || 'pending'}`);
  log(`Platform: ${r.platform}`);

  if (r.counters) {
    const c = r.counters;
    log(`Tests: ${c.total} total, ${c.passed} passed, ${c.failed} failed, ${c.errored} errored, ${c.skipped} skipped`);
  }

  if (r.deviceMinutes) {
    log(`Device minutes: ${r.deviceMinutes.total} total (${r.deviceMinutes.metered} metered)`);
  }

  return r;
}

function listRuns() {
  const result = aws(`devicefarm list-runs --arn "${PROJECT_ARN}"`);
  const runs = result.runs || [];

  if (runs.length === 0) {
    log('No test runs found.');
    return;
  }

  log(`Recent test runs (${runs.length}):\n`);
  for (const r of runs.slice(0, 10)) {
    const date = new Date(r.created * 1000).toISOString().slice(0, 16);
    const result = r.result || r.status;
    const minutes = r.deviceMinutes?.total || 0;
    console.log(`  ${date}  ${result.padEnd(10)}  ${minutes}min  ${r.name}`);
    console.log(`    ${r.arn}`);
  }
}

function listPools() {
  const privatePools = aws(`devicefarm list-device-pools --arn "${PROJECT_ARN}" --type PRIVATE`);
  const curatedPools = aws(`devicefarm list-device-pools --arn "${PROJECT_ARN}" --type CURATED`);

  log('Private device pools:');
  for (const p of privatePools.devicePools || []) {
    console.log(`  ${p.name} — ${p.description || 'no description'}`);
    console.log(`    ${p.arn}`);
  }

  log('\nCurated device pools:');
  for (const p of curatedPools.devicePools || []) {
    console.log(`  ${p.name} — ${p.description || 'no description'}`);
    console.log(`    ${p.arn}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('help')) {
  console.log(`
AWS Device Farm Test Runner for xAI Workspace

Usage:
  node scripts/device-farm-test.mjs                 Build APK + upload + run fuzz test
  node scripts/device-farm-test.mjs --upload-only   Upload APK without scheduling a test
  node scripts/device-farm-test.mjs --status <arn>  Check status of a test run
  node scripts/device-farm-test.mjs --list-runs     List recent test runs
  node scripts/device-farm-test.mjs --list-pools    List available device pools

Config:
  Project:  ${PROJECT_ARN}
  Profile:  ${AWS_PROFILE}
  Region:   ${AWS_REGION}
`);
  process.exit(0);
}

if (args.includes('--status')) {
  const arn = args[args.indexOf('--status') + 1];
  if (!arn) die('Provide a run ARN: --status <arn>');
  checkStatus(arn);
} else if (args.includes('--list-runs')) {
  listRuns();
} else if (args.includes('--list-pools')) {
  listPools();
} else {
  // Full flow: build → upload → test
  log('AWS Device Farm Test Runner');
  log(`Project: ${PROJECT_ARN}`);
  log('');

  // Verify AWS access
  log('Verifying AWS access...');
  try {
    aws(`devicefarm get-project --arn "${PROJECT_ARN}"`);
    log('AWS access verified.');
  } catch (err) {
    die(
      `Cannot access Device Farm project. Ensure:\n` +
      `  1. AWS CLI profile "${AWS_PROFILE}" is configured\n` +
      `  2. Device Farm permissions are granted (run scripts/device-farm-iam-setup.sh in CloudShell)\n` +
      `  3. The project ARN is correct`
    );
  }

  // Try to build; if Gradle/Java unavailable, use existing artifact
  let artifact;
  if (args.includes('--skip-build')) {
    artifact = findExistingArtifact();
    if (!artifact) die('No existing APK or AAB found. Build with Android Studio first, or install Java and remove --skip-build.');
    log(`Using existing artifact: ${artifact.name}`);
  } else {
    try {
      artifact = buildApk();
    } catch (err) {
      log('Gradle build failed — checking for existing artifact...');
      artifact = findExistingArtifact();
      if (!artifact) die('No APK/AAB found and Gradle build failed. Install Java or build with Android Studio first.');
      log(`Using existing artifact: ${artifact.name}`);
    }
  }

  const size = (readFileSync(artifact.path).length / 1024 / 1024).toFixed(1);
  log(`Artifact: ${artifact.name} (${size} MB)`);
  const uploadArn = uploadApk(artifact);

  if (args.includes('--upload-only')) {
    log(`\nAPK uploaded: ${uploadArn}`);
    log('Skipping test run (--upload-only).');
  } else {
    const devicePoolArn = getOrCreateDevicePool();
    scheduleRun(uploadArn, devicePoolArn);
  }
}
