import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
  await page.goto('/invite');
  await page.waitForLoadState('networkidle');
});

test.describe('Invite Page', () => {
  test('hero has gradient background and logo with drop-shadow', async ({ page }) => {
    const hero = page.locator('.invite-hero');
    await expect(hero).toBeVisible();

    const bg = await hero.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('linear-gradient');

    const logo = page.locator('.invite-logo');
    await expect(logo).toBeVisible();

    const filter = await logo.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('drop-shadow');
  });

  test('title has gradient text', async ({ page }) => {
    const title = page.locator('.invite-hero h1');
    await expect(title).toBeVisible();

    const bgImage = await title.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('gradient');
  });

  test('CTA button has pill shape and box-shadow', async ({ page }) => {
    const cta = page.locator('.invite-cta').first();
    if (await cta.count() > 0) {
      const borderRadius = await cta.evaluate((el) => getComputedStyle(el).borderRadius);
      expect(borderRadius).toBe('20px');

      const boxShadow = await cta.evaluate((el) => getComputedStyle(el).boxShadow);
      expect(boxShadow).not.toBe('none');
    }
  });

  test('features list visible', async ({ page }) => {
    const features = page.locator('.invite-features');
    await expect(features).toBeVisible();

    const items = page.locator('.invite-feature');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('footer links are present', async ({ page }) => {
    const footerLinks = page.locator('.invite-footer-links');
    await expect(footerLinks).toBeVisible();

    const links = footerLinks.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
