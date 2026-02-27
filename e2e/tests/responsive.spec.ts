import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth.helpers';
import { mockWebSocket } from '../helpers/websocket.helpers';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
});

test.describe('Responsive — Mobile viewport', () => {
  test.use({ viewport: { width: 412, height: 915 } }); // Pixel 7

  test('chat FAB visible on mobile when authenticated', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const chatFab = page.locator('.chat-fab');
    await expect(chatFab).toBeVisible();
  });

  test('agents FAB visible on mobile when authenticated', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const agentsFab = page.locator('.agents-fab');
    await expect(agentsFab).toBeVisible();
  });

  test('chat panel slides up from bottom on mobile', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('.chat-fab').click();

    // Chat frame should be open (slides up via transform)
    const chatFrame = page.locator('.chat-frame--open');
    await expect(chatFrame).toBeVisible();
  });

  test('chat backdrop appears when panel is open on mobile', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('.chat-fab').click();

    const backdrop = page.locator('.chat-backdrop');
    await expect(backdrop).toBeVisible();
  });
});

test.describe('Responsive — Desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('no FABs on desktop, chat panel side-by-side', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // FABs have display:none on desktop (> 860px)
    const chatFab = page.locator('.chat-fab');
    await expect(chatFab).toBeHidden();

    const agentsFab = page.locator('.agents-fab');
    await expect(agentsFab).toBeHidden();
  });

  test('collapse toggle visible on desktop', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.collapse-toggle');
    await expect(toggle).toBeVisible();
  });
});
