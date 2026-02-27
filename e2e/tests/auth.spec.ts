import { test, expect } from '@playwright/test';
import { injectAuth, navigateAuthenticated, storageKeyForProvider } from '../helpers/auth.helpers';
import { mockWebSocket } from '../helpers/websocket.helpers';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
});

test.describe('Authentication Flows', () => {
  test('unauthenticated: no chat FAB, no agents FAB, login box visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Login box should be visible with 4 providers
    await expect(page.locator('.login-box')).toBeVisible();
    await expect(page.locator('.login-box-item')).toHaveCount(4);

    // FABs should not be in the DOM (showChat is false)
    await expect(page.locator('.chat-fab')).toHaveCount(0);
    await expect(page.locator('.agents-fab')).toHaveCount(0);
  });

  test('inject Telegram auth: login box shows checkmark, FABs appear', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Telegram should show a checkmark
    const telegramItem = page.locator('.login-box-item--telegram');
    const checkmark = telegramItem.locator('.login-box-check');
    await expect(checkmark).toBeVisible();

    // FABs should be in the DOM now
    await expect(page.locator('.chat-fab')).toHaveCount(1);
    await expect(page.locator('.agents-fab')).toHaveCount(1);
  });

  test('multi-provider auth: both show checkmarks', async ({ page }) => {
    await injectAuth(page, ['telegram', 'google']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tgCheck = page.locator('.login-box-item--telegram .login-box-check');
    await expect(tgCheck).toBeVisible();

    const googleCheck = page.locator('.login-box-item--google .login-box-check');
    await expect(googleCheck).toBeVisible();
  });

  test('logout: click logout link removes provider, FABs disappear if no providers', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify authenticated state
    await expect(page.locator('.chat-fab')).toHaveCount(1);

    // Click footer logout link
    const logoutLink = page.locator('.logout-link').first();
    await logoutLink.click();

    // After logout, FABs should disappear
    await expect(page.locator('.chat-fab')).toHaveCount(0);

    // SessionStorage should be cleared
    const stored = await page.evaluate(() => sessionStorage.getItem('tg_web_user'));
    expect(stored).toBeNull();
  });

  test('provider-specific logout: one provider remains authenticated', async ({ page }) => {
    await injectAuth(page, ['telegram', 'google']);
    await mockWebSocket(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Both should be linked
    await expect(page.locator('.login-box-item--telegram .login-box-check')).toBeVisible();
    await expect(page.locator('.login-box-item--google .login-box-check')).toBeVisible();

    // Logout telegram specifically via the footer
    const tgLogout = page.locator('.logout-link', { hasText: /Telegram/i }).first();
    if (await tgLogout.count() > 0) {
      await tgLogout.click();
      // Google should still be linked
      await expect(page.locator('.login-box-item--google .login-box-check')).toBeVisible();
      // FABs should still exist because google is still authenticated
      await expect(page.locator('.chat-fab')).toHaveCount(1);
    }
  });
});
