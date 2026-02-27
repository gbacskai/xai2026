import { test as base, Page } from '@playwright/test';
import { injectAuth } from '../helpers/auth.helpers';
import { mockWebSocket, mockWebSocketConnected } from '../helpers/websocket.helpers';

type AuthFixtures = {
  authenticatedPage: Page;
  connectedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  /** Page with Telegram auth injected and WebSocket mocked (disconnected). */
  authenticatedPage: async ({ page }, use) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocket(page);
    await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  /** Page with Telegram auth + WebSocket connected (echoes messages). */
  connectedPage: async ({ page }, use) => {
    await injectAuth(page, ['telegram']);
    await mockWebSocketConnected(page);
    await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect } from '@playwright/test';
