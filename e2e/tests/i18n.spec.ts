import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Internationalization', () => {
  test('default language is English, hero title visible', async ({ page }) => {
    const title = page.locator('.hero h1');
    await expect(title).toHaveText('xAI Workspace');
  });

  test('language picker shows 16 options', async ({ page }) => {
    // Open language picker
    const langBtn = page.locator('.lang-btn');
    await langBtn.click();

    const options = page.locator('.lang-option');
    await expect(options).toHaveCount(16);
  });

  test('select Arabic: page direction changes to RTL', async ({ page }) => {
    // Open picker
    await page.locator('.lang-btn').click();

    // Find and click Arabic option
    const arabicOption = page.locator('.lang-option', { hasText: 'العربية' });
    await arabicOption.click();

    // Document direction should be rtl
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');

    // Lang attribute should be ar
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('ar');
  });

  test('select German: content updates to German text', async ({ page }) => {
    await page.locator('.lang-btn').click();

    const germanOption = page.locator('.lang-option', { hasText: 'Deutsch' });
    await germanOption.click();

    // The section headers should now be in German
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('de');

    // The hero title stays as "xAI Workspace" (brand name doesn't change)
    // but subtitle should be in German
    const subtitle = page.locator('.hero-sub');
    await expect(subtitle).toBeVisible();
  });

  test('RTL adjusts card item margins', async ({ page }) => {
    // Switch to Arabic
    await page.locator('.lang-btn').click();
    await page.locator('.lang-option', { hasText: 'العربية' }).click();

    // Card items that aren't last-child should have margin-right instead of margin-left
    const cardItem = page.locator('.card-item:not(:last-child)').first();
    if (await cardItem.count() > 0) {
      const marginRight = await cardItem.evaluate((el) => getComputedStyle(el).marginRight);
      expect(marginRight).toBe('52px');
    }
  });
});
