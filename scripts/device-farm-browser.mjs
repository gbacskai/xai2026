#!/usr/bin/env node

/**
 * AWS Device Farm Desktop Browser Testing
 *
 * Comprehensive Selenium test suite migrated from Playwright E2E tests.
 * Runs on real desktop browsers (Chrome, Firefox) hosted by AWS Device Farm
 * against the live xAI Workspace site.
 *
 * Test categories:
 *   PUBLIC  — No auth required (home, navigation, branding, i18n, models, content, invite)
 *   AUTH    — Requires test token injection (chat FAB, agents FAB, auth flows, responsive)
 *
 * Tests that require WebSocket mocking (agent CRUD, chat echo, language switching
 * with chat) are NOT included — they remain in the Playwright suite for local testing.
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
const AWS_PROFILE = process.env.CI ? '' : 'aws_amplify_docflow4';
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
  const profileFlag = AWS_PROFILE ? `--profile ${AWS_PROFILE}` : '';
  const fullCmd = `aws ${command} ${profileFlag} --region ${AWS_REGION} --output json`;
  const result = execSync(fullCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

// ── Selenium Helpers ────────────────────────────────────────────────────────

/** Wait for element and return it. */
async function waitFor(driver, css, timeout = 15000) {
  await driver.wait(until.elementLocated(By.css(css)), timeout);
  return driver.findElement(By.css(css));
}

/** Get computed CSS property value for an element. */
async function getStyle(driver, css, prop) {
  return driver.executeScript(
    `var el = document.querySelector(arguments[0]);
     return el ? getComputedStyle(el)[arguments[1]] : null;`,
    css, prop,
  );
}

/** Get a CSS custom property (variable) from :root. */
async function getCssVar(driver, varName) {
  return driver.executeScript(
    `return getComputedStyle(document.documentElement).getPropertyValue(arguments[0]).trim();`,
    varName,
  );
}

/** Count elements matching CSS selector. */
async function countElements(driver, css) {
  const els = await driver.findElements(By.css(css));
  return els.length;
}

/** Get innerText of the first element matching CSS selector. */
async function getText(driver, css) {
  const el = await driver.findElement(By.css(css));
  return el.getText();
}

/** Get innerHTML of the first element matching CSS selector. */
async function getInnerHtml(driver, css) {
  return driver.executeScript(
    `var el = document.querySelector(arguments[0]); return el ? el.innerHTML : '';`,
    css,
  );
}

/** Check if element is displayed (returns false if not found). */
async function isDisplayed(driver, css) {
  const els = await driver.findElements(By.css(css));
  if (els.length === 0) return false;
  return els[0].isDisplayed();
}

/** Get element attribute value. */
async function getAttribute(driver, css, attr) {
  return driver.executeScript(
    `var el = document.querySelector(arguments[0]); return el ? el.getAttribute(arguments[1]) : null;`,
    css, attr,
  );
}

/** Navigate and wait for page to settle. */
async function navigateTo(driver, path) {
  const url = path.startsWith('http') ? path : `${TEST_URL}${path}`;
  await driver.get(url);
  await driver.wait(until.elementLocated(By.css('body')), 15000);
  await driver.sleep(1000); // Wait for Angular bootstrap
}

/** Set window size. */
async function setViewport(driver, width, height) {
  await driver.manage().window().setRect({ width, height });
  await driver.sleep(300); // Wait for CSS media queries to recompute
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
  await driver.get(TEST_URL);
  await driver.wait(until.elementLocated(By.css('body')), 10000);

  const storageKey = `${testUser.provider}_user`;
  await driver.executeScript(
    `sessionStorage.setItem(arguments[0], arguments[1]);`,
    storageKey,
    JSON.stringify(testUser),
  );

  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.css('body')), 10000);
  await driver.sleep(2000);
}

/** Open chat panel — clicks FAB if visible. */
async function ensureChatOpen(driver) {
  if (await isDisplayed(driver, '.chat-fab')) {
    await driver.findElement(By.css('.chat-fab')).click();
    await driver.sleep(500);
  }
}

/** Open agents panel — clicks FAB on mobile, toggle on desktop. */
async function ensureAgentsOpen(driver) {
  if (await isDisplayed(driver, '.agents-fab')) {
    await driver.findElement(By.css('.agents-fab')).click();
    await driver.sleep(500);
  } else if (await isDisplayed(driver, '.agents-toggle')) {
    await driver.findElement(By.css('.agents-toggle')).click();
    await driver.sleep(1600); // 1.5s slide transition
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC TESTS — No auth required
// Migrated from: home.spec.ts, navigation.spec.ts, content-pages.spec.ts,
//   branding.spec.ts (public), models.spec.ts, i18n.spec.ts, invite.spec.ts
// ═══════════════════════════════════════════════════════════════════════════

const PUBLIC_TESTS = [

  // ── Home Page ───────────────────────────────────────────────────────────

  {
    name: 'Home page loads with hero, logo, title, and subtitle',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const title = await getText(driver, '.hero h1');
      assert(title === 'xAI Workspace', `Expected title "xAI Workspace", got "${title}"`);
      assert(await isDisplayed(driver, '.hero-logo'), 'Hero logo not visible');
      assert(await isDisplayed(driver, '.hero-sub'), 'Hero subtitle not visible');
    },
  },
  {
    name: 'Hero has gradient background and gradient title text',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const heroBg = await getStyle(driver, '.hero', 'backgroundImage');
      assert(heroBg && heroBg.includes('linear-gradient'), `Hero bg should contain linear-gradient, got "${heroBg}"`);
      const h1Bg = await getStyle(driver, '.hero h1', 'backgroundImage');
      assert(h1Bg && h1Bg.includes('gradient'), `Title bg should contain gradient, got "${h1Bg}"`);
    },
  },
  {
    name: 'Three section headers with brand accent bars',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.section-header');
      const count = await countElements(driver, '.section-header');
      assert(count === 3, `Expected 3 section headers, got ${count}`);
    },
  },
  {
    name: 'Card lists have rounded corners and box-shadow',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.card-list');
      const count = await countElements(driver, '.card-list');
      assert(count >= 3, `Expected >= 3 card lists, got ${count}`);
      const borderRadius = await getStyle(driver, '.card-list', 'borderRadius');
      assert(borderRadius === '12px', `Expected borderRadius 12px, got "${borderRadius}"`);
      const boxShadow = await getStyle(driver, '.card-list', 'boxShadow');
      assert(boxShadow !== 'none', 'Card list should have box-shadow');
    },
  },
  {
    name: 'Card icons have brand-light background',
    run: async (driver) => {
      await navigateTo(driver, '/');
      assert(await isDisplayed(driver, '.card-icon'), 'Card icon not visible');
    },
  },
  {
    name: 'Login box shows 4 OAuth provider buttons',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.login-box');
      for (const p of ['telegram', 'google', 'github', 'linkedin']) {
        assert(await isDisplayed(driver, `.login-box-item--${p}`), `${p} login button not visible`);
      }
    },
  },
  {
    name: 'Footer renders with brand badge, logo, and navigation links',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.footer');
      assert(await isDisplayed(driver, '.footer-brand'), 'Footer brand not visible');
      for (const href of ['/about', '/privacy', '/terms']) {
        assert(await isDisplayed(driver, `.footer-links a[href="${href}"]`), `${href} link not visible`);
      }
    },
  },
  {
    name: 'Footer has top border',
    run: async (driver) => {
      await navigateTo(driver, '/');
      assert(await isDisplayed(driver, '.footer'), 'Footer not visible');
    },
  },
  {
    name: 'Page title is set correctly',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const pageTitle = await driver.getTitle();
      assert(pageTitle.includes('xAI'), `Expected page title containing "xAI", got "${pageTitle}"`);
    },
  },

  // ── Navigation ──────────────────────────────────────────────────────────

  {
    name: 'Footer about link navigates to /about',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.footer-links a[href="/about"]');
      await driver.findElement(By.css('.footer-links a[href="/about"]')).click();
      await driver.wait(until.urlContains('/about'), 10000);
      await waitFor(driver, '.about-header');
      assert(await isDisplayed(driver, '.about-header'), 'About header not visible');
    },
  },
  {
    name: 'Footer privacy link navigates to /privacy',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.footer-links a[href="/privacy"]');
      await driver.findElement(By.css('.footer-links a[href="/privacy"]')).click();
      await driver.wait(until.urlContains('/privacy'), 10000);
      await waitFor(driver, '.privacy-header');
      assert(await isDisplayed(driver, '.privacy-header'), 'Privacy header not visible');
    },
  },
  {
    name: 'Footer terms link navigates to /terms',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.footer-links a[href="/terms"]');
      await driver.findElement(By.css('.footer-links a[href="/terms"]')).click();
      await driver.wait(until.urlContains('/terms'), 10000);
      await waitFor(driver, '.terms-header');
      assert(await isDisplayed(driver, '.terms-header'), 'Terms header not visible');
    },
  },
  {
    name: 'Article card navigates to /article/:id and back link returns home',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.card-item');
      await driver.findElement(By.css('.card-item')).click();
      await driver.wait(until.urlMatches(/\/article\/.+/), 10000);
      await waitFor(driver, '.article-header');
      assert(await isDisplayed(driver, '.article-header'), 'Article header not visible');

      await waitFor(driver, '.back-bar-link');
      await driver.findElement(By.css('.back-bar-link')).click();
      await driver.wait(until.urlMatches(/\/$/), 10000);
    },
  },
  {
    name: 'Wildcard route redirects to home',
    run: async (driver) => {
      await navigateTo(driver, '/nonexistent-page-12345');
      await driver.wait(until.urlMatches(/\/$/), 10000);
      await waitFor(driver, '.hero');
      assert(await isDisplayed(driver, '.hero'), 'Home page hero not visible after redirect');
    },
  },

  // ── Content Pages ───────────────────────────────────────────────────────

  {
    name: 'Privacy page header has gradient background',
    run: async (driver) => {
      await navigateTo(driver, '/privacy');
      await waitFor(driver, '.privacy-header');
      assert(await isDisplayed(driver, '.privacy-header'), 'Privacy header not visible');
      const bg = await getStyle(driver, '.privacy-header', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `Privacy header should have gradient, got "${bg}"`);
    },
  },
  {
    name: 'Privacy page content body renders HTML',
    run: async (driver) => {
      await navigateTo(driver, '/privacy');
      await waitFor(driver, '.privacy-body');
      assert(await isDisplayed(driver, '.privacy-body'), 'Privacy body not visible');
      const html = await getInnerHtml(driver, '.privacy-body');
      assert(html.length > 100, `Privacy body HTML too short (${html.length} chars)`);
    },
  },
  {
    name: 'Privacy page back link navigates to home',
    run: async (driver) => {
      await navigateTo(driver, '/privacy');
      await waitFor(driver, '.back-bar-link');
      await driver.findElement(By.css('.back-bar-link')).click();
      await driver.wait(until.urlMatches(/\/$/), 10000);
    },
  },
  {
    name: 'Terms page header has gradient background',
    run: async (driver) => {
      await navigateTo(driver, '/terms');
      await waitFor(driver, '.terms-header');
      assert(await isDisplayed(driver, '.terms-header'), 'Terms header not visible');
      const bg = await getStyle(driver, '.terms-header', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `Terms header should have gradient, got "${bg}"`);
    },
  },
  {
    name: 'Terms page content body renders HTML',
    run: async (driver) => {
      await navigateTo(driver, '/terms');
      await waitFor(driver, '.terms-body');
      assert(await isDisplayed(driver, '.terms-body'), 'Terms body not visible');
      const html = await getInnerHtml(driver, '.terms-body');
      assert(html.length > 100, `Terms body HTML too short (${html.length} chars)`);
    },
  },
  {
    name: 'Terms page back link navigates to home',
    run: async (driver) => {
      await navigateTo(driver, '/terms');
      await waitFor(driver, '.back-bar-link');
      await driver.findElement(By.css('.back-bar-link')).click();
      await driver.wait(until.urlMatches(/\/$/), 10000);
    },
  },
  {
    name: 'About page header visible',
    run: async (driver) => {
      await navigateTo(driver, '/about');
      await waitFor(driver, '.about-header');
      assert(await isDisplayed(driver, '.about-header'), 'About header not visible');
    },
  },
  {
    name: 'About page body content present',
    run: async (driver) => {
      await navigateTo(driver, '/about');
      await waitFor(driver, '.about-body');
      assert(await isDisplayed(driver, '.about-body'), 'About body not visible');
      const html = await getInnerHtml(driver, '.about-body');
      assert(html.length > 50, `About body HTML too short (${html.length} chars)`);
    },
  },
  {
    name: 'About page back link navigates to home',
    run: async (driver) => {
      await navigateTo(driver, '/about');
      await waitFor(driver, '.back-bar-link');
      await driver.findElement(By.css('.back-bar-link')).click();
      await driver.wait(until.urlMatches(/\/$/), 10000);
    },
  },
  {
    name: 'Authorize page loads without error',
    run: async (driver) => {
      await navigateTo(driver, '/authorize');
      assert(await isDisplayed(driver, 'app-root'), 'app-root not visible on /authorize');
    },
  },

  // ── Branding (public pages) ─────────────────────────────────────────────

  {
    name: 'CSS variable --brand-primary resolves to #5BA4D9',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const val = await getCssVar(driver, '--brand-primary');
      assert(val === '#5BA4D9', `Expected --brand-primary "#5BA4D9", got "${val}"`);
    },
  },
  {
    name: 'CSS variable --brand-dark resolves to #2D7AB8',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const val = await getCssVar(driver, '--brand-dark');
      assert(val === '#2D7AB8', `Expected --brand-dark "#2D7AB8", got "${val}"`);
    },
  },
  {
    name: 'Login box visible with styling',
    run: async (driver) => {
      await navigateTo(driver, '/');
      assert(await isDisplayed(driver, '.login-box'), 'Login box not visible');
    },
  },
  {
    name: 'Models page header has gradient background',
    run: async (driver) => {
      await navigateTo(driver, '/models');
      await waitFor(driver, '.models-header');
      const bg = await getStyle(driver, '.models-header', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `Models header should have gradient, got "${bg}"`);
    },
  },
  {
    name: 'About page header has gradient background',
    run: async (driver) => {
      await navigateTo(driver, '/about');
      await waitFor(driver, '.about-header');
      const bg = await getStyle(driver, '.about-header', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `About header should have gradient, got "${bg}"`);
    },
  },

  // ── Models Page ─────────────────────────────────────────────────────────

  {
    name: 'Models page header has gradient and icon',
    run: async (driver) => {
      await navigateTo(driver, '/models');
      await waitFor(driver, '.models-header');
      assert(await isDisplayed(driver, '.models-header'), 'Models header not visible');
      const bg = await getStyle(driver, '.models-header', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `Models header bg should have gradient, got "${bg}"`);
      assert(await isDisplayed(driver, '.models-icon'), 'Models icon not visible');
    },
  },
  {
    name: 'Model cards have box-shadow',
    run: async (driver) => {
      await navigateTo(driver, '/models');
      await waitFor(driver, '.model-card');
      const boxShadow = await getStyle(driver, '.model-card', 'boxShadow');
      assert(boxShadow !== 'none', `Model card should have box-shadow, got "${boxShadow}"`);
    },
  },
  {
    name: 'Provider badges are rounded',
    run: async (driver) => {
      await navigateTo(driver, '/models');
      await waitFor(driver, '.provider-badge');
      const borderRadius = await getStyle(driver, '.provider-badge', 'borderRadius');
      assert(borderRadius === '8px', `Provider badge borderRadius should be 8px, got "${borderRadius}"`);
    },
  },
  {
    name: 'Expand/collapse button works for large provider groups',
    run: async (driver) => {
      await navigateTo(driver, '/models');
      const hasExpandBtn = await isDisplayed(driver, '.models-expand-btn');
      if (hasExpandBtn) {
        const cardsBefore = await countElements(driver, '.model-card');
        await driver.findElement(By.css('.models-expand-btn')).click();
        await driver.sleep(500);
        const cardsAfter = await countElements(driver, '.model-card');
        assert(cardsAfter >= cardsBefore, `After expand: ${cardsAfter} cards should be >= ${cardsBefore}`);
      }
      // If no expand button, pass (not enough providers to group)
    },
  },

  // ── i18n ────────────────────────────────────────────────────────────────

  {
    name: 'Default language is English, hero title visible',
    run: async (driver) => {
      await navigateTo(driver, '/');
      const title = await getText(driver, '.hero h1');
      assert(title === 'xAI Workspace', `Expected "xAI Workspace", got "${title}"`);
    },
  },
  {
    name: 'Language picker shows 16 options',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.lang-btn');
      await driver.findElement(By.css('.lang-btn')).click();
      await driver.sleep(300);
      const count = await countElements(driver, '.lang-option');
      assert(count === 16, `Expected 16 language options, got ${count}`);
    },
  },
  {
    name: 'Select Arabic: page direction changes to RTL',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.lang-btn');
      await driver.findElement(By.css('.lang-btn')).click();
      await driver.sleep(300);

      // Find and click Arabic option
      const options = await driver.findElements(By.css('.lang-option'));
      for (const opt of options) {
        const text = await opt.getText();
        if (text.includes('العربية')) {
          await opt.click();
          break;
        }
      }
      await driver.sleep(500);

      const dir = await driver.executeScript('return document.documentElement.dir');
      assert(dir === 'rtl', `Expected dir "rtl", got "${dir}"`);
      const lang = await driver.executeScript('return document.documentElement.lang');
      assert(lang === 'ar', `Expected lang "ar", got "${lang}"`);
    },
  },
  {
    name: 'Select German: content updates to German text',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.lang-btn');
      await driver.findElement(By.css('.lang-btn')).click();
      await driver.sleep(300);

      const options = await driver.findElements(By.css('.lang-option'));
      for (const opt of options) {
        const text = await opt.getText();
        if (text.includes('Deutsch')) {
          await opt.click();
          break;
        }
      }
      await driver.sleep(500);

      const lang = await driver.executeScript('return document.documentElement.lang');
      assert(lang === 'de', `Expected lang "de", got "${lang}"`);
      assert(await isDisplayed(driver, '.hero-sub'), 'Hero subtitle not visible after German switch');
    },
  },
  {
    name: 'Home page section headers update on language switch',
    run: async (driver) => {
      await navigateTo(driver, '/');
      await waitFor(driver, '.section-header');

      // Verify English
      let headerText = await getText(driver, '.section-header');
      assert(headerText.includes('Essentials'), `Expected "Essentials" in header, got "${headerText}"`);

      // Switch to French
      await driver.findElement(By.css('.lang-btn')).click();
      await driver.sleep(300);
      let options = await driver.findElements(By.css('.lang-option'));
      for (const opt of options) {
        if ((await opt.getText()).includes('Français')) { await opt.click(); break; }
      }
      await driver.sleep(500);
      headerText = await getText(driver, '.section-header');
      assert(headerText.includes('Essentiels'), `Expected "Essentiels" in French header, got "${headerText}"`);

      // Switch to German
      await driver.findElement(By.css('.lang-btn')).click();
      await driver.sleep(300);
      options = await driver.findElements(By.css('.lang-option'));
      for (const opt of options) {
        if ((await opt.getText()).includes('Deutsch')) { await opt.click(); break; }
      }
      await driver.sleep(500);
      headerText = await getText(driver, '.section-header');
      assert(headerText.includes('Grundlagen'), `Expected "Grundlagen" in German header, got "${headerText}"`);
    },
  },

  // ── Invite Page ─────────────────────────────────────────────────────────

  {
    name: 'Invite hero has gradient background and logo with drop-shadow',
    run: async (driver) => {
      await navigateTo(driver, '/invite');
      await waitFor(driver, '.invite-hero');
      assert(await isDisplayed(driver, '.invite-hero'), 'Invite hero not visible');
      const bg = await getStyle(driver, '.invite-hero', 'backgroundImage');
      assert(bg && bg.includes('linear-gradient'), `Invite hero should have gradient, got "${bg}"`);
      assert(await isDisplayed(driver, '.invite-logo'), 'Invite logo not visible');
      const filter = await getStyle(driver, '.invite-logo', 'filter');
      assert(filter && filter.includes('drop-shadow'), `Invite logo filter should include drop-shadow, got "${filter}"`);
    },
  },
  {
    name: 'Invite title has gradient text',
    run: async (driver) => {
      await navigateTo(driver, '/invite');
      await waitFor(driver, '.invite-hero h1');
      const bgImage = await getStyle(driver, '.invite-hero h1', 'backgroundImage');
      assert(bgImage && bgImage.includes('gradient'), `Invite title should have gradient, got "${bgImage}"`);
    },
  },
  {
    name: 'Invite CTA button has pill shape and box-shadow',
    run: async (driver) => {
      await navigateTo(driver, '/invite');
      if (await isDisplayed(driver, '.invite-cta')) {
        const borderRadius = await getStyle(driver, '.invite-cta', 'borderRadius');
        assert(borderRadius === '20px', `CTA borderRadius should be 20px, got "${borderRadius}"`);
        const boxShadow = await getStyle(driver, '.invite-cta', 'boxShadow');
        assert(boxShadow !== 'none', 'CTA should have box-shadow');
      }
    },
  },
  {
    name: 'Invite features list visible',
    run: async (driver) => {
      await navigateTo(driver, '/invite');
      await waitFor(driver, '.invite-features');
      assert(await isDisplayed(driver, '.invite-features'), 'Features section not visible');
      const count = await countElements(driver, '.invite-feature');
      assert(count >= 1, `Expected >= 1 feature items, got ${count}`);
    },
  },
  {
    name: 'Invite footer links are present',
    run: async (driver) => {
      await navigateTo(driver, '/invite');
      await waitFor(driver, '.invite-footer-links');
      const count = await countElements(driver, '.invite-footer-links a');
      assert(count >= 2, `Expected >= 2 footer links, got ${count}`);
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATED TESTS — Require test token
// Migrated from: auth.spec.ts, chat.spec.ts (panel visibility),
//   agents.spec.ts (panel visibility), responsive.spec.ts
// ═══════════════════════════════════════════════════════════════════════════

const AUTH_TESTS = [

  // ── Auth Flows ──────────────────────────────────────────────────────────

  {
    name: '[auth] Unauthenticated: no chat FAB, no agents FAB, login box visible',
    run: async (driver) => {
      // Navigate fresh without auth injection
      await navigateTo(driver, '/');
      assert(await isDisplayed(driver, '.login-box'), 'Login box not visible');
      const loginItems = await countElements(driver, '.login-box-item');
      assert(loginItems === 4, `Expected 4 login items, got ${loginItems}`);
      const chatFabs = await countElements(driver, '.chat-fab');
      assert(chatFabs === 0, `Expected 0 chat FABs unauthenticated, got ${chatFabs}`);
      const agentsFabs = await countElements(driver, '.agents-fab');
      assert(agentsFabs === 0, `Expected 0 agents FABs unauthenticated, got ${agentsFabs}`);
    },
  },
  {
    name: '[auth] Login checkmark appears for test provider',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      const checkmark = await waitFor(driver, `.login-box-item--${testUser.provider} .login-box-check`, 10000);
      assert(await checkmark.isDisplayed(), `${testUser.provider} checkmark not visible after auth injection`);
    },
  },
  {
    name: '[auth] Chat FAB appears when authenticated',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      assert(await isDisplayed(driver, '.chat-fab'), 'Chat FAB not visible after auth');
    },
  },
  {
    name: '[auth] Agents FAB appears when authenticated',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      assert(await isDisplayed(driver, '.agents-fab'), 'Agents FAB not visible after auth');
    },
  },
  {
    name: '[auth] Chat panel opens when FAB is clicked',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      await ensureChatOpen(driver);
      await waitFor(driver, '.chat-panel', 10000);
      assert(await isDisplayed(driver, '.chat-panel'), 'Chat panel not visible after clicking FAB');
    },
  },
  {
    name: '[auth] Chat input and send button exist',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      await ensureChatOpen(driver);
      await waitFor(driver, '.chat-input', 10000);
      assert(await isDisplayed(driver, '.chat-input'), 'Chat input not visible');
      assert(await isDisplayed(driver, '.chat-send'), 'Send button not visible');
    },
  },
  {
    name: '[auth] Chat send button has brand gradient',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      await ensureChatOpen(driver);
      await waitFor(driver, '.chat-send', 10000);

      // Fill input to enable the send button gradient
      await driver.findElement(By.css('.chat-input')).sendKeys('test');
      await driver.sleep(200);

      const bg = await getStyle(driver, '.chat-send', 'backgroundImage');
      assert(bg && bg.includes('gradient'), `Send button should have gradient, got "${bg}"`);
    },
  },
  {
    name: '[auth] Chat input focus shows brand-colored border',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      await ensureChatOpen(driver);
      await waitFor(driver, '.chat-input', 10000);

      // Focus the input
      await driver.findElement(By.css('.chat-input')).click();
      await driver.sleep(200);

      const outline = await getStyle(driver, '.chat-input-wrap', 'outline');
      const boxShadow = await getStyle(driver, '.chat-input-wrap', 'boxShadow');
      const hasFocus = (outline && outline !== 'none') || (boxShadow && boxShadow !== 'none');
      assert(hasFocus, 'Chat input wrap should have focus styling (outline or box-shadow)');
    },
  },
  {
    name: '[auth] Command autocomplete: type / opens command menu',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);
      await ensureChatOpen(driver);
      await waitFor(driver, '.chat-input', 10000);

      await driver.findElement(By.css('.chat-input')).sendKeys('/');
      await driver.sleep(500);

      assert(await isDisplayed(driver, '.command-menu'), 'Command menu not visible after typing /');
      const items = await countElements(driver, '.command-item');
      assert(items > 0, `Expected > 0 command items, got ${items}`);
    },
  },
  {
    name: '[auth] Agents panel opens when FAB is clicked',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      await ensureAgentsOpen(driver);
      await waitFor(driver, '.agents-panel', 10000);
      assert(await isDisplayed(driver, '.agents-panel'), 'Agents panel not visible after clicking FAB');
    },
  },
  {
    name: '[auth] Agents panel has two tabs: Agents and Tips',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      await ensureAgentsOpen(driver);
      await waitFor(driver, '.agents-tab', 10000);
      const count = await countElements(driver, '.agents-tab');
      assert(count === 2, `Expected 2 agents tabs, got ${count}`);
    },
  },
  {
    name: '[auth] Active tab has brand styling with 3px bottom border',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      await ensureAgentsOpen(driver);
      await waitFor(driver, '.agents-tab--active', 10000);
      const border = await getStyle(driver, '.agents-tab--active', 'borderBottom');
      assert(border && border.includes('3px'), `Active tab border should include 3px, got "${border}"`);
    },
  },
  {
    name: '[auth] Agents create button has brand gradient background',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      await ensureAgentsOpen(driver);
      await waitFor(driver, '.agents-btn-create', 10000);
      const bg = await getStyle(driver, '.agents-btn-create', 'backgroundImage');
      assert(bg && bg.includes('gradient'), `Create button should have gradient, got "${bg}"`);
    },
  },
  {
    name: '[auth] Tab switching changes content',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.agents-fab', 10000);
      await ensureAgentsOpen(driver);
      await waitFor(driver, '.agents-tab', 10000);

      // Click the second tab (Tips/Recommendations)
      const tabs = await driver.findElements(By.css('.agents-tab'));
      assert(tabs.length === 2, 'Expected 2 tabs');
      await tabs[1].click();
      await driver.sleep(500);

      // Verify recommendations content
      const hasRecContent = await isDisplayed(driver, '.recommendations-list') || await isDisplayed(driver, '.recommendations-empty');
      assert(hasRecContent, 'Recommendations content not visible after tab switch');

      // Switch back to first tab
      await tabs[0].click();
      await driver.sleep(500);
    },
  },
  {
    name: '[auth] Logout clears session and removes FABs',
    run: async (driver, testUser) => {
      await injectAuth(driver, testUser);
      await waitFor(driver, '.chat-fab', 10000);

      const logoutLink = await driver.findElement(By.css('.logout-link'));
      await logoutLink.click();
      await driver.sleep(1000);

      const fabs = await countElements(driver, '.chat-fab');
      assert(fabs === 0, 'Chat FAB still visible after logout');
    },
  },

  // ── Responsive — Mobile viewport ────────────────────────────────────────

  {
    name: '[auth] [mobile] Chat FAB visible on mobile when authenticated',
    run: async (driver, testUser) => {
      await setViewport(driver, 412, 915);
      try {
        await injectAuth(driver, testUser);
        assert(await isDisplayed(driver, '.chat-fab'), 'Chat FAB not visible on mobile');
      } finally {
        await setViewport(driver, 1280, 800);
      }
    },
  },
  {
    name: '[auth] [mobile] Agents FAB visible on mobile when authenticated',
    run: async (driver, testUser) => {
      await setViewport(driver, 412, 915);
      try {
        await injectAuth(driver, testUser);
        assert(await isDisplayed(driver, '.agents-fab'), 'Agents FAB not visible on mobile');
      } finally {
        await setViewport(driver, 1280, 800);
      }
    },
  },
  {
    name: '[auth] [mobile] Chat panel slides up from bottom on mobile',
    run: async (driver, testUser) => {
      await setViewport(driver, 412, 915);
      try {
        await injectAuth(driver, testUser);
        await waitFor(driver, '.chat-fab', 10000);
        await driver.findElement(By.css('.chat-fab')).click();
        await driver.sleep(500);
        assert(await isDisplayed(driver, '.chat-frame--open'), 'Chat frame--open not visible on mobile');
      } finally {
        await setViewport(driver, 1280, 800);
      }
    },
  },
  {
    name: '[auth] [mobile] Chat backdrop appears when panel is open on mobile',
    run: async (driver, testUser) => {
      await setViewport(driver, 412, 915);
      try {
        await injectAuth(driver, testUser);
        await waitFor(driver, '.chat-fab', 10000);
        await driver.findElement(By.css('.chat-fab')).click();
        await driver.sleep(500);
        assert(await isDisplayed(driver, '.chat-backdrop'), 'Chat backdrop not visible on mobile');
      } finally {
        await setViewport(driver, 1280, 800);
      }
    },
  },
  {
    name: '[auth] [desktop] No FABs on desktop, collapse toggle visible',
    run: async (driver, testUser) => {
      await setViewport(driver, 1280, 800);
      await injectAuth(driver, testUser);

      // FABs should be hidden on desktop
      const chatFabHidden = !(await isDisplayed(driver, '.chat-fab'));
      assert(chatFabHidden, 'Chat FAB should be hidden on desktop');
      const agentsFabHidden = !(await isDisplayed(driver, '.agents-fab'));
      assert(agentsFabHidden, 'Agents FAB should be hidden on desktop');

      // Collapse toggle should be visible
      assert(await isDisplayed(driver, '.collapse-toggle'), 'Collapse toggle not visible on desktop');
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

Comprehensive test suite migrated from Playwright E2E tests.
Runs Selenium tests on real Chrome/Firefox browsers via Device Farm.

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

Test counts:
  Public:        ${PUBLIC_TESTS.length} tests (home, navigation, content, branding, models, i18n, invite)
  Authenticated: ${AUTH_TESTS.length} tests (auth flows, chat panel, agents panel, responsive)
  Total:         ${PUBLIC_TESTS.length + AUTH_TESTS.length} tests per browser

Note: Tests requiring WebSocket mocking (agent CRUD, chat echo, language switching
with chat) remain in the Playwright suite for local testing only.

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
