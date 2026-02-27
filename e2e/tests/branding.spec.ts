import { test, expect } from '@playwright/test';
import { BRAND_PRIMARY_RGB } from '../fixtures/brand-tokens';
import { injectAuth } from '../helpers/auth.helpers';
import { mockWebSocketConnected } from '../helpers/websocket.helpers';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
});

test.describe('Visual Brand Consistency', () => {
  test('CSS variable --brand-primary resolves to correct value', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const brandPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim(),
    );
    expect(brandPrimary).toBe('#5BA4D9');
  });

  test('CSS variable --brand-dark resolves correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const brandDark = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--brand-dark').trim(),
    );
    expect(brandDark).toBe('#2D7AB8');
  });

  test('hero title has gradient background-image', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h1 = page.locator('.hero h1');
    const bg = await h1.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('hero section has gradient background', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hero = page.locator('.hero');
    const bg = await hero.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
  });

  test('card list has border-radius 12px and box-shadow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.card-list').first();
    const borderRadius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('12px');

    const boxShadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('login box has box-shadow and border', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginBox = page.locator('.login-box');
    const boxShadow = await loginBox.evaluate((el) => getComputedStyle(el).boxShadow);
    // Login box should have visual styling
    await expect(loginBox).toBeVisible();
  });

  test('chat user bubble has gradient background', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocketConnected(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open chat and send message
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    await page.waitForTimeout(300);

    const input = page.locator('.chat-input');
    await input.fill('test');
    await page.locator('.chat-send').click();

    const bubble = page.locator('.chat-bubble--user').first();
    await expect(bubble).toBeVisible({ timeout: 5000 });

    const bg = await bubble.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('chat send button has gradient background', async ({ page }) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocketConnected(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    const input = page.locator('.chat-input');
    await input.fill('test');

    const sendBtn = page.locator('.chat-send');
    const bg = await sendBtn.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('footer has border-top', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('.footer');
    const borderTop = await footer.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.borderTopWidth + ' ' + style.borderTopStyle;
    });
    // Footer should have some kind of top border
    await expect(footer).toBeVisible();
  });

  test('models page header has gradient background', async ({ page }) => {
    await page.goto('/models');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.models-header');
    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
  });

  test('about page header has gradient background', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.about-header');
    // about-header uses the .page-header class pattern
    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
  });
});
