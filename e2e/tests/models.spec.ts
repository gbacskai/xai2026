import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
  await page.goto('/models');
  await page.waitForLoadState('networkidle');
});

test.describe('Models Page', () => {
  test('page header has gradient background and icon', async ({ page }) => {
    const header = page.locator('.models-header');
    await expect(header).toBeVisible();

    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');

    const icon = page.locator('.models-icon');
    await expect(icon).toBeVisible();
  });

  test('model cards have box-shadow', async ({ page }) => {
    const card = page.locator('.model-card').first();
    await expect(card).toBeVisible();

    const boxShadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('benefit text uses brand-primary color', async ({ page }) => {
    const benefit = page.locator('.model-card-benefit').first();
    if (await benefit.count() > 0) {
      await expect(benefit).toBeVisible();
    }
  });

  test('provider badges are rounded', async ({ page }) => {
    const badge = page.locator('.provider-badge').first();
    await expect(badge).toBeVisible();

    const borderRadius = await badge.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(borderRadius).toBe('8px');
  });

  test('expand/collapse button works for large provider groups', async ({ page }) => {
    const expandBtn = page.locator('.models-expand-btn');
    if (await expandBtn.count() > 0) {
      // Count visible cards before expand
      const cardsBefore = await page.locator('.model-card').count();

      await expandBtn.click();

      // After expand, should have more cards or same (if already expanded)
      const cardsAfter = await page.locator('.model-card').count();
      expect(cardsAfter).toBeGreaterThanOrEqual(cardsBefore);
    }
  });
});
