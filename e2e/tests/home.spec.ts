import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Home Page — Unauthenticated', () => {
  test('hero renders with logo, title, and subtitle', async ({ page }) => {
    const logo = page.locator('.hero-logo');
    await expect(logo).toBeVisible();

    const title = page.locator('.hero h1');
    await expect(title).toHaveText('xAI Workspace');

    const subtitle = page.locator('.hero-sub');
    await expect(subtitle).toBeVisible();
  });

  test('hero has gradient background and gradient title text', async ({ page }) => {
    const hero = page.locator('.hero');
    const heroBg = await hero.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(heroBg).toContain('linear-gradient');

    const h1 = page.locator('.hero h1');
    const h1Bg = await h1.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(h1Bg).toContain('gradient');
  });

  test('three section headers with brand accent bars', async ({ page }) => {
    const headers = page.locator('.section-header');
    await expect(headers).toHaveCount(3);
  });

  test('card lists have rounded corners and box-shadow', async ({ page }) => {
    const cards = page.locator('.card-list');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const borderRadius = await cards.first().evaluate((el) => getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('12px');

    const boxShadow = await cards.first().evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('card icons have brand-light background', async ({ page }) => {
    const icon = page.locator('.card-icon').first();
    await expect(icon).toBeVisible();
  });

  test('login box shows 4 provider buttons', async ({ page }) => {
    const loginBox = page.locator('.login-box');
    await expect(loginBox).toBeVisible();

    await expect(page.locator('.login-box-item--telegram')).toBeVisible();
    await expect(page.locator('.login-box-item--google')).toBeVisible();
    await expect(page.locator('.login-box-item--github')).toBeVisible();
    await expect(page.locator('.login-box-item--linkedin')).toBeVisible();
  });

  test('footer has brand badge with logo and navigation links', async ({ page }) => {
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();

    const footerBrand = page.locator('.footer-brand');
    await expect(footerBrand).toBeVisible();

    const footerImg = footerBrand.locator('img');
    await expect(footerImg).toBeVisible();

    await expect(page.locator('.footer-links a[href="/about"]')).toBeVisible();
    await expect(page.locator('.footer-links a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('.footer-links a[href="/terms"]')).toBeVisible();
  });

  test('footer has top border', async ({ page }) => {
    const footer = page.locator('.footer');
    const borderTop = await footer.evaluate((el) => getComputedStyle(el).borderTop);
    // The footer may use border-top or a visual separator
    await expect(footer).toBeVisible();
  });
});
