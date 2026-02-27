import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
});

test.describe('Privacy Page', () => {
  test('header has gradient background', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.privacy-header');
    await expect(header).toBeVisible();

    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
  });

  test('content body renders HTML', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    const body = page.locator('.privacy-body');
    await expect(body).toBeVisible();
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });

  test('back link navigates to home', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    await page.locator('.back-bar-link').click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Terms Page', () => {
  test('header has gradient background', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.terms-header');
    await expect(header).toBeVisible();

    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');
  });

  test('content body renders HTML', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    const body = page.locator('.terms-body');
    await expect(body).toBeVisible();
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(100);
  });

  test('back link navigates to home', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    await page.locator('.back-bar-link').click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('About Page', () => {
  test('header visible', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.about-header');
    await expect(header).toBeVisible();
  });

  test('body content present', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const body = page.locator('.about-body');
    await expect(body).toBeVisible();
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(50);
  });

  test('back link navigates to home', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    await page.locator('.back-bar-link').click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Authorize Page', () => {
  test('page loads without error', async ({ page }) => {
    await page.goto('/authorize');
    await page.waitForLoadState('networkidle');
    // Authorize page should render (it may redirect or show content)
    await expect(page.locator('app-root')).toBeVisible();
  });
});
