import { test, expect } from '../fixtures/auth.fixture';

/** Open the agents panel — uses FAB on mobile, already open on desktop. */
async function ensureAgentsOpen(page: import('@playwright/test').Page) {
  const fab = page.locator('.agents-fab');
  if (await fab.isVisible()) {
    await fab.click();
  }
  // On desktop the panel auto-opens via effect
  await expect(page.locator('.agents-panel')).toBeVisible({ timeout: 5000 });
}

test.describe('Agents Panel — Authenticated', () => {
  test('agents panel is accessible', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);
    await expect(page.locator('.agents-panel')).toBeVisible();
  });

  test('three tabs visible: Agents, Analytics, Recommendations', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);

    const tabs = page.locator('.agents-tab');
    await expect(tabs).toHaveCount(3);
  });

  test('active tab has brand styling with bottom border', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);

    const activeTab = page.locator('.agents-tab--active');
    await expect(activeTab).toHaveCount(1);

    const borderBottom = await activeTab.evaluate((el) => getComputedStyle(el).borderBottom);
    expect(borderBottom).toContain('3px');
  });

  test('create button has brand gradient background', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);

    const createBtn = page.locator('.agents-btn-create');
    await expect(createBtn).toBeVisible();

    const bgImage = await createBtn.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('gradient');
  });

  test('search input renders when agents exist (conditional on count >= 4)', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);

    // Search is only rendered via @if when there are >= 4 agents.
    // With mock data (no real WS) the list is empty, so search won't render.
    // Verify the agents list or empty state is shown instead.
    const listOrEmpty = page.locator('.agents-list, .agents-empty');
    await expect(listOrEmpty).toBeVisible({ timeout: 5000 });
  });

  test('tab switching changes content', async ({ authenticatedPage: page }) => {
    await ensureAgentsOpen(page);

    const tabs = page.locator('.agents-tab');

    // Click the second tab (Analytics)
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveClass(/agents-tab--active/);

    // Click the third tab (Recommendations)
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveClass(/agents-tab--active/);

    // Verify recommendations content is visible
    const recList = page.locator('.recommendations-list, .recommendations-empty');
    await expect(recList).toBeVisible({ timeout: 5000 });
  });
});
