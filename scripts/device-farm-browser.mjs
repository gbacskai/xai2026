#!/usr/bin/env node

/**
 * AWS Device Farm Desktop Browser Testing
 *
 * Runs smoke tests on real desktop browsers (Chrome, Firefox)
 * hosted by AWS Device Farm, against the live xAI Workspace site.
 *
 * Supports both unauthenticated (public pages) and authenticated (chat, agents)
 * test suites. Authenticated tests require a backend test endpoint.
 *
 * Prerequisites:
 *   1. AWS CLI profile aws_amplify_docflow4 with devicefarm permissions
 *   2. selenium-webdriver installed (npm install --save-dev selenium-webdriver)
 *   3. For authenticated tests: DEVICEFARM_TEST_SECRET env var
 *
 * Usage:
 *   node scripts/device-farm-browser.mjs                          # All browsers, public tests
 *   node scripts/device-farm-browser.mjs --auth                   # Include authenticated tests
 *   node scripts/device-farm-browser.mjs --browser chrome         # Chrome only
 *   node scripts/device-farm-browser.mjs --browser firefox        # Firefox only
 *   node scripts/device-farm-browser.mjs --url http://localhost:4200  # Test local dev
 *   node scripts/device-farm-browser.mjs --list-sessions          # List recent sessions
 *
 * Backend endpoint required for --auth:
 *   GET https://router.xaiworkspace.com/auth/test/token?secret=<DEVICEFARM_TEST_SECRET>
 *
 *   Returns: { "provider": "google", "code": "...", "email": "test@...", "name": "Test User" }
 *
 *   This endpoint should:
 *     - Validate the shared secret
 *     - Return credentials for a dedicated test user
 *     - Rate-limit to prevent abuse
 */

import { execSync } from 'node:child_process';
import { Builder, By, until } from 'selenium-webdriver';

// ── Config ──────────────────────────────────────────────────────────────────

const TEST_GRID_ARN = 'arn:aws:devicefarm:us-west-2:695829630004:testgrid-project:ae6b7a7a-6d02-4313-86a6-f3076f5e64f1';
const AWS_PROFILE = 'aws_amplify_docflow4';
const AWS_REGION = 'us-west-2';
const DEFAULT_URL = 'https://xaiworkspace.com';
const ROUTER_URL = 'https://router.xaiworkspace.com';

const args = process.argv.slice(2);
const BROWSER_ARG = args.includes('--browser') ? args[args.indexOf('--browser') + 1] : null;
const TEST_URL = args.includes('--url') ? args[args.indexOf('--url') + 1] : DEFAULT_URL;
const BROWSERS = BROWSER_ARG ? [BROWSER_ARG] : ['chrome', 'firefox'];
const RUN_AUTH = args.includes('--auth');
const TEST_SECRET = process.env.DEVICEFARM_TEST_SECRET;

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`[browser-test] ${msg}`); }
function pass(msg) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg) { console.log(`  \x1b[31m✗\x1b[0m ${msg}`); }

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function aws(command) {
  const fullCmd = `aws ${command} --profile ${AWS_PROFILE} --region ${AWS_REGION} --output json`;
  const result = execSync(fullCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

// ── Get Selenium Hub URL ────────────────────────────────────────────────────

function getTestGridUrl() {
  log('Generating Device Farm test grid URL...');
  const result = aws(
    `devicefarm create-test-grid-url --project-arn "${TEST_GRID_ARN}" --expires-in-seconds 900`
  );
  return result.url;
}

// ── Test Auth Token ─────────────────────────────────────────────────────────

async function fetchTestToken() {
  if (!TEST_SECRET) {
    return null;
  }

  log('Fetching test auth token from backend...');
  const url = `${ROUTER_URL}/auth/test/token?secret=${encodeURIComponent(TEST_SECRET)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    log(`WARNING: Test token fetch failed: ${res.status} ${text}`);
    return null;
  }

  const data = await res.json();
  log(`Test token obtained for ${data.email || data.provider || 'test user'}`);
  return data;
}

/**
 * Inject auth into sessionStorage via Selenium executeScript.
 * Navigates to the site first (sessionStorage is origin-scoped),
 * sets the auth data, then reloads so Angular picks it up.
 */
async function injectAuth(driver, testUser) {
  // Navigate to the site to set sessionStorage on the correct origin
  await driver.get(TEST_URL);
  await driver.wait(until.elementLocated(By.css('body')), 10000);

  // Inject the test user into sessionStorage (mirrors e2e/helpers/auth.helpers.ts)
  const storageKey = `${testUser.provider}_user`;
  await driver.executeScript(
    `sessionStorage.setItem(arguments[0], arguments[1]);`,
    storageKey,
    JSON.stringify(testUser),
  );

  // Reload so Angular's AuthService picks up the injected session
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.css('body')), 10000);

  // Wait for Angular to bootstrap and process the auth
  await driver.sleep(2000);
}

// ── Public Tests (no auth required) ─────────────────────────────────────────

const PUBLIC_TESTS = [
  {
    name: 'Home page loads with hero and title',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.hero h1')), 15000);
      const title = await driver.findElement(By.css('.hero h1')).getText();
      assert(title === 'xAI Workspace', `Expected title "xAI Workspace", got "${title}"`);

      const logo = await driver.findElement(By.css('.hero-logo'));
      assert(await logo.isDisplayed(), 'Hero logo not visible');
    },
  },
  {
    name: 'Login box shows OAuth provider buttons',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.login-box')), 15000);

      const providers = ['telegram', 'google', 'github', 'linkedin'];
      for (const p of providers) {
        const btn = await driver.findElement(By.css(`.login-box-item--${p}`));
        assert(await btn.isDisplayed(), `${p} login button not visible`);
      }
    },
  },
  {
    name: 'Footer renders with navigation links',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.footer')), 15000);

      const aboutLink = await driver.findElement(By.css('.footer-links a[href="/about"]'));
      assert(await aboutLink.isDisplayed(), 'About link not visible');

      const privacyLink = await driver.findElement(By.css('.footer-links a[href="/privacy"]'));
      assert(await privacyLink.isDisplayed(), 'Privacy link not visible');

      const termsLink = await driver.findElement(By.css('.footer-links a[href="/terms"]'));
      assert(await termsLink.isDisplayed(), 'Terms link not visible');
    },
  },
  {
    name: 'Navigation to /about works',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.footer-links a[href="/about"]')), 15000);
      await driver.findElement(By.css('.footer-links a[href="/about"]')).click();
      await driver.wait(until.urlContains('/about'), 10000);
      await driver.wait(until.elementLocated(By.css('.about-header')), 10000);
      const header = await driver.findElement(By.css('.about-header'));
      assert(await header.isDisplayed(), 'About header not visible');
    },
  },
  {
    name: 'Navigation to /privacy works',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.footer-links a[href="/privacy"]')), 15000);
      await driver.findElement(By.css('.footer-links a[href="/privacy"]')).click();
      await driver.wait(until.urlContains('/privacy'), 10000);
      await driver.wait(until.elementLocated(By.css('.privacy-header')), 10000);
      const header = await driver.findElement(By.css('.privacy-header'));
      assert(await header.isDisplayed(), 'Privacy header not visible');
    },
  },
  {
    name: 'Three section headers on home page',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.section-header')), 15000);
      const headers = await driver.findElements(By.css('.section-header'));
      assert(headers.length === 3, `Expected 3 section headers, got ${headers.length}`);
    },
  },
  {
    name: 'Wildcard route redirects to home',
    run: async (driver) => {
      await driver.get(`${TEST_URL}/nonexistent-page-12345`);
      await driver.wait(until.urlMatches(/\/$/), 10000);
      await driver.wait(until.elementLocated(By.css('.hero')), 10000);
      const hero = await driver.findElement(By.css('.hero'));
      assert(await hero.isDisplayed(), 'Home page hero not visible after redirect');
    },
  },
  {
    name: 'Page title is set correctly',
    run: async (driver) => {
      await driver.get(TEST_URL);
      await driver.wait(until.elementLocated(By.css('.hero')), 15000);
      const pageTitle = await driver.getTitle();
      assert(pageTitle.includes('xAI'), `Expected page title containing "xAI", got "${pageTitle}"`);
    },
  },
];

// ── Authenticated Tests (require test token) ────────────────────────────────

const AUTH_TESTS = [
  {
    name: '[auth] Login checkmark appears for test provider',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      const checkmark = await driver.findElement(By.css(`.login-box-item--${testUser.provider} .login-box-check`));
      assert(await checkmark.isDisplayed(), `${testUser.provider} checkmark not visible after auth injection`);
    },
  },
  {
    name: '[auth] Chat FAB appears when authenticated',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.chat-fab')), 10000);
      const fab = await driver.findElement(By.css('.chat-fab'));
      assert(await fab.isDisplayed(), 'Chat FAB not visible after auth');
    },
  },
  {
    name: '[auth] Agents FAB appears when authenticated',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.agents-fab')), 10000);
      const fab = await driver.findElement(By.css('.agents-fab'));
      assert(await fab.isDisplayed(), 'Agents FAB not visible after auth');
    },
  },
  {
    name: '[auth] Chat panel opens when FAB is clicked',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.chat-fab')), 10000);

      // On desktop the panel may auto-open; on mobile click the FAB
      const fab = await driver.findElement(By.css('.chat-fab'));
      if (await fab.isDisplayed()) {
        await fab.click();
      }
      await driver.wait(until.elementLocated(By.css('.chat-panel')), 10000);
      const panel = await driver.findElement(By.css('.chat-panel'));
      assert(await panel.isDisplayed(), 'Chat panel not visible after clicking FAB');
    },
  },
  {
    name: '[auth] Chat input and send button exist',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.chat-fab')), 10000);

      const fab = await driver.findElement(By.css('.chat-fab'));
      if (await fab.isDisplayed()) {
        await fab.click();
      }
      await driver.wait(until.elementLocated(By.css('.chat-input')), 10000);

      const input = await driver.findElement(By.css('.chat-input'));
      assert(await input.isDisplayed(), 'Chat input not visible');

      const sendBtn = await driver.findElement(By.css('.chat-send'));
      assert(await sendBtn.isDisplayed(), 'Send button not visible');
    },
  },
  {
    name: '[auth] Agents panel opens when FAB is clicked',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.agents-fab')), 10000);

      const fab = await driver.findElement(By.css('.agents-fab'));
      await fab.click();

      await driver.wait(until.elementLocated(By.css('.agents-panel')), 10000);
      const panel = await driver.findElement(By.css('.agents-panel'));
      assert(await panel.isDisplayed(), 'Agents panel not visible after clicking FAB');
    },
  },
  {
    name: '[auth] Logout clears session and removes FABs',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await driver.wait(until.elementLocated(By.css('.chat-fab')), 10000);

      // Click logout
      const logoutLink = await driver.findElement(By.css('.logout-link'));
      await logoutLink.click();

      // Wait for FABs to disappear
      await driver.sleep(1000);
      const fabs = await driver.findElements(By.css('.chat-fab'));
      assert(fabs.length === 0, 'Chat FAB still visible after logout');
    },
  },
];

// ── Run Tests ───────────────────────────────────────────────────────────────

async function runTestsOnBrowser(hubUrl, browserName, testUser) {
  log(`\n── ${browserName.toUpperCase()} ──`);

  let driver;
  try {
    driver = await new Builder()
      .usingServer(hubUrl)
      .forBrowser(browserName)
      .build();

    await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
    await driver.manage().window().setRect({ width: 1280, height: 800 });
  } catch (err) {
    const totalTests = PUBLIC_TESTS.length + (testUser ? AUTH_TESTS.length : 0);
    fail(`Failed to create ${browserName} session: ${err.message}`);
    return { browser: browserName, passed: 0, failed: totalTests, results: [] };
  }

  let passed = 0;
  let failed = 0;
  const results = [];

  // Run public tests
  log('  Public tests:');
  for (const test of PUBLIC_TESTS) {
    try {
      await test.run(driver);
      pass(test.name);
      passed++;
      results.push({ name: test.name, passed: true });
    } catch (err) {
      fail(`${test.name} — ${err.message}`);
      failed++;
      results.push({ name: test.name, passed: false, error: err.message });
    }
  }

  // Run authenticated tests
  if (testUser) {
    log('  Authenticated tests:');
    for (const test of AUTH_TESTS) {
      try {
        await test.run(driver, testUser);
        pass(test.name);
        passed++;
        results.push({ name: test.name, passed: true });
      } catch (err) {
        fail(`${test.name} — ${err.message}`);
        failed++;
        results.push({ name: test.name, passed: false, error: err.message });
      }
    }
  }

  try {
    await driver.quit();
  } catch {}

  log(`  ${passed} passed, ${failed} failed`);
  return { browser: browserName, passed, failed, results };
}

// ── List Sessions ───────────────────────────────────────────────────────────

function listSessions() {
  const result = aws(`devicefarm list-test-grid-sessions --project-arn "${TEST_GRID_ARN}"`);
  const sessions = result.testGridSessions || [];

  if (sessions.length === 0) {
    log('No recent browser test sessions.');
    return;
  }

  log(`Recent browser test sessions (${sessions.length}):\n`);
  for (const s of sessions.slice(0, 10)) {
    const created = new Date(s.created * 1000).toISOString().slice(0, 16);
    const status = s.status || 'unknown';
    const mins = s.billingMinutes || 0;
    console.log(`  ${created}  ${status.padEnd(10)}  ${mins}min  ${s.arn}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

if (args.includes('--help') || args.includes('help')) {
  console.log(`
AWS Device Farm Desktop Browser Testing for xAI Workspace

Usage:
  node scripts/device-farm-browser.mjs                          Run public tests on all browsers
  node scripts/device-farm-browser.mjs --auth                   Include authenticated tests
  node scripts/device-farm-browser.mjs --browser chrome         Chrome only
  node scripts/device-farm-browser.mjs --browser firefox        Firefox only
  node scripts/device-farm-browser.mjs --url http://localhost:4200  Test local URL
  node scripts/device-farm-browser.mjs --list-sessions          List recent sessions

Environment:
  DEVICEFARM_TEST_SECRET    Shared secret for backend test auth endpoint (required for --auth)

Config:
  Test Grid:  ${TEST_GRID_ARN}
  Profile:    ${AWS_PROFILE}
  Region:     ${AWS_REGION}
  Target URL: ${TEST_URL}
  Browsers:   ${BROWSERS.join(', ')}

Backend endpoint for --auth:
  GET ${ROUTER_URL}/auth/test/token?secret=<DEVICEFARM_TEST_SECRET>
  Returns: { "provider": "google", "code": "...", "email": "...", "name": "..." }
`);
  process.exit(0);
}

if (args.includes('--list-sessions')) {
  listSessions();
  process.exit(0);
}

// Fetch test user token if --auth is requested
let testUser = null;
if (RUN_AUTH) {
  if (!TEST_SECRET) {
    console.error('\n[ERROR] --auth requires DEVICEFARM_TEST_SECRET environment variable.\n');
    console.error('Set it with: export DEVICEFARM_TEST_SECRET=<your_secret>\n');
    console.error('The backend needs a GET /auth/test/token endpoint. See --help for details.\n');
    process.exit(1);
  }
  testUser = await fetchTestToken();
  if (!testUser) {
    console.error('\n[ERROR] Failed to fetch test auth token. Check the backend endpoint.\n');
    process.exit(1);
  }
}

const publicCount = PUBLIC_TESTS.length;
const authCount = testUser ? AUTH_TESTS.length : 0;
const totalTests = publicCount + authCount;

log('AWS Device Farm Desktop Browser Testing');
log(`Target: ${TEST_URL}`);
log(`Browsers: ${BROWSERS.join(', ')}`);
log(`Tests: ${publicCount} public + ${authCount} authenticated = ${totalTests} total`);
if (testUser) {
  log(`Auth: ${testUser.provider} (${testUser.email || testUser.name || 'test user'})`);
}

const hubUrl = getTestGridUrl();
log('Test grid URL obtained (expires in 15 min)');

const allResults = [];
for (const browser of BROWSERS) {
  const result = await runTestsOnBrowser(hubUrl, browser, testUser);
  allResults.push(result);
}

// Summary
log('\n── SUMMARY ──');
let totalPassed = 0;
let totalFailed = 0;
for (const r of allResults) {
  const icon = r.failed === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${icon} ${r.browser}: ${r.passed}/${r.passed + r.failed} passed`);
  totalPassed += r.passed;
  totalFailed += r.failed;
}

log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed across ${allResults.length} browser(s)`);
log(`Console: https://us-west-2.console.aws.amazon.com/devicefarm/home?region=us-west-2#/testgrid/projects/${TEST_GRID_ARN.split(':').pop()}`);

process.exit(totalFailed > 0 ? 1 : 0);
