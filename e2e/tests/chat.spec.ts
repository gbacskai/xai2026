import { test, expect } from '../fixtures/auth.fixture';

test.describe('Chat Panel — Authenticated + Connected', () => {
  test('chat panel is accessible (auto-opens on desktop, FAB on mobile)', async ({ connectedPage: page }) => {
    // On desktop (>860px) the panel auto-opens via effect; on mobile the FAB opens it
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }
    // The chat panel component should be visible regardless of viewport
    await expect(page.locator('.chat-panel')).toBeVisible();
  });

  test('chat header shows connected status', async ({ connectedPage: page }) => {
    // Open chat
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    // Wait for WebSocket auth_ok to process
    await page.waitForTimeout(300);

    const status = page.locator('.chat-header-status--connected');
    await expect(status).toBeVisible({ timeout: 5000 });
  });

  test('type message, send, user bubble appears with gradient', async ({ connectedPage: page }) => {
    // Open chat
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    await page.waitForTimeout(300);

    // Type a message
    const input = page.locator('.chat-input');
    await input.fill('Hello world');

    // Send button should be enabled
    const sendBtn = page.locator('.chat-send');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // User bubble should appear
    const userBubble = page.locator('.chat-bubble--user').first();
    await expect(userBubble).toBeVisible({ timeout: 5000 });

    // User bubble should have gradient background
    const bgImage = await userBubble.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('gradient');
  });

  test('chat input focus shows brand-colored border', async ({ connectedPage: page }) => {
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    const input = page.locator('.chat-input');
    await input.focus();

    // Check for outline or box-shadow on focus
    const wrap = page.locator('.chat-input-wrap');
    const outline = await wrap.evaluate((el) => getComputedStyle(el).outline);
    const boxShadow = await wrap.evaluate((el) => getComputedStyle(el).boxShadow);
    // At least one of these should indicate focus styling
    const hasFocusStyle = outline !== 'none' || boxShadow !== 'none';
    expect(hasFocusStyle).toBeTruthy();
  });

  test('send button has brand gradient', async ({ connectedPage: page }) => {
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    const input = page.locator('.chat-input');
    await input.fill('test');

    const sendBtn = page.locator('.chat-send');
    const bgImage = await sendBtn.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('gradient');
  });

  test('command autocomplete: type / opens command menu', async ({ connectedPage: page }) => {
    const fab = page.locator('.chat-fab');
    if (await fab.isVisible()) {
      await fab.click();
    }

    await page.waitForTimeout(300);

    const input = page.locator('.chat-input');
    await input.fill('/');

    // Command menu should appear
    const commandMenu = page.locator('.command-menu');
    await expect(commandMenu).toBeVisible({ timeout: 3000 });

    // Should have command items
    const items = page.locator('.command-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });
});
