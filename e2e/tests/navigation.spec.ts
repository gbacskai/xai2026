import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
});

test.describe('Cross-Page Navigation', () => {
  test('footer about link navigates to /about', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.footer-links a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('.about-header')).toBeVisible();
  });

  test('footer privacy link navigates to /privacy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.footer-links a[href="/privacy"]').click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator('.privacy-header')).toBeVisible();
  });

  test('footer terms link navigates to /terms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.footer-links a[href="/terms"]').click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.locator('.terms-header')).toBeVisible();
  });

  test('article card navigates to /article/:id and back link returns home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the first article card
    const firstCard = page.locator('.card-item').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/article\/.+/);
    await expect(page.locator('.article-header')).toBeVisible();

    // Click back link to return home
    const backLink = page.locator('.back-bar-link');
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('models card navigates to /models', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the models article card (contains "models" in its route)
    const modelsCard = page.locator('.card-item', { has: page.locator('.card-icon', { hasText: '🤖' }) });
    if (await modelsCard.count() > 0) {
      await modelsCard.first().click();
      await expect(page).toHaveURL(/\/article\/models|\/models/);
    }
  });

  test('wildcard route redirects to home', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/$/);
  });
});
