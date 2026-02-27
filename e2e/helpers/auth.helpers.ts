import { Page } from '@playwright/test';

export type Provider = 'telegram' | 'google' | 'github' | 'linkedin';

export const MOCK_TELEGRAM_USER = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  auth_date: Math.floor(Date.now() / 1000),
  hash: 'mock_hash_value',
};

export const MOCK_GOOGLE_USER = {
  provider: 'google' as const,
  code: 'mock_google_code',
  email: 'test@example.com',
  name: 'Test User',
};

export const MOCK_GITHUB_USER = {
  provider: 'github' as const,
  code: 'mock_github_code',
};

export const MOCK_LINKEDIN_USER = {
  provider: 'linkedin' as const,
  code: 'mock_linkedin_code',
};

const PROVIDER_STORAGE: Record<Provider, { key: string; data: object }> = {
  telegram: { key: 'tg_web_user', data: MOCK_TELEGRAM_USER },
  google: { key: 'google_user', data: MOCK_GOOGLE_USER },
  github: { key: 'github_user', data: MOCK_GITHUB_USER },
  linkedin: { key: 'linkedin_user', data: MOCK_LINKEDIN_USER },
};

/**
 * Inject auth provider data into sessionStorage before Angular bootstraps.
 * Uses page.addInitScript so it runs before any app code.
 */
export async function injectAuth(page: Page, providers: Provider[]): Promise<void> {
  for (const provider of providers) {
    const { key, data } = PROVIDER_STORAGE[provider];
    await page.addInitScript(
      ({ k, d }) => {
        sessionStorage.setItem(k, JSON.stringify(d));
      },
      { k: key, d: data },
    );
  }
}

/** Remove auth provider data from sessionStorage. */
export async function clearAuth(page: Page, providers: Provider[]): Promise<void> {
  for (const provider of providers) {
    const { key } = PROVIDER_STORAGE[provider];
    await page.evaluate((k) => sessionStorage.removeItem(k), key);
  }
}

/** Inject auth, block the router config fetch, navigate, and wait for load. */
export async function navigateAuthenticated(
  page: Page,
  url: string,
  providers: Provider[] = ['telegram'],
): Promise<void> {
  await injectAuth(page, providers);
  // Block external API calls that would fail in test
  await page.route('**/router.xaiworkspace.com/**', (route) => route.abort());
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

export function storageKeyForProvider(provider: Provider): string {
  return PROVIDER_STORAGE[provider].key;
}
