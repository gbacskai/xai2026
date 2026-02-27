import { Injectable, inject, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { PlatformService } from './platform.service';

export interface TelegramLoginUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface GoogleUser {
  provider: 'google';
  code: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GitHubUser {
  provider: 'github';
  code: string;
}

export interface LinkedInUser {
  provider: 'linkedin';
  code: string;
}

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);
  private platformSvc = inject(PlatformService);

  readonly webUser = signal<TelegramLoginUser | null>(null);
  readonly googleUser = signal<GoogleUser | null>(null);
  readonly githubUser = signal<GitHubUser | null>(null);
  readonly linkedinUser = signal<LinkedInUser | null>(null);
  /** Incremented whenever an auth attempt fails or is cancelled */
  readonly authFailed = signal(0);
  readonly isAuthenticated = computed(() => !!this.webUser() || !!this.googleUser() || !!this.githubUser() || !!this.linkedinUser());
  readonly currentProvider = computed<'telegram' | 'google' | 'github' | 'linkedin' | null>(() => {
    if (this.linkedinUser()) return 'linkedin';
    if (this.githubUser()) return 'github';
    if (this.googleUser()) return 'google';
    if (this.webUser()) return 'telegram';
    return null;
  });

  private readonly botId = environment.botId;
  private googleClientId = '';

  private ghStorageHandler: ((event: StorageEvent) => void) | null = null;
  private ghStorageTimeout: ReturnType<typeof setTimeout> | null = null;
  private liStorageHandler: ((event: StorageEvent) => void) | null = null;
  private liStorageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Fetch public config (Google client ID) from the router
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 5000);
    fetch(`${environment.routerUrl}/config`, { signal: controller.signal })
      .then(r => r.json())
      .then(cfg => { this.googleClientId = cfg.googleClientId || ''; })
      .catch(() => { /* router unreachable — Google login will be unavailable */ })
      .finally(() => clearTimeout(fetchTimeout));

    // Restore session from storage (sync on web, async on native)
    if (this.platformSvc.isNative) {
      this.restoreSessionAsync();
    } else {
      this.restoreSessionSync();
    }
  }

  private restoreSessionSync(): void {
    const stored = sessionStorage.getItem('tg_web_user');
    if (stored) {
      try { this.webUser.set(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const googleStored = sessionStorage.getItem('google_user');
    if (googleStored) {
      try { this.googleUser.set(JSON.parse(googleStored)); } catch { /* ignore */ }
    }
    const githubStored = sessionStorage.getItem('github_user');
    if (githubStored) {
      try { this.githubUser.set(JSON.parse(githubStored)); } catch { /* ignore */ }
    }
    const linkedinStored = sessionStorage.getItem('linkedin_user');
    if (linkedinStored) {
      try { this.linkedinUser.set(JSON.parse(linkedinStored)); } catch { /* ignore */ }
    }
  }

  private async restoreSessionAsync(): Promise<void> {
    const keys: { key: string; setter: (v: any) => void }[] = [
      { key: 'tg_web_user', setter: v => this.webUser.set(v) },
      { key: 'google_user', setter: v => this.googleUser.set(v) },
      { key: 'github_user', setter: v => this.githubUser.set(v) },
      { key: 'linkedin_user', setter: v => this.linkedinUser.set(v) },
    ];
    for (const { key, setter } of keys) {
      const val = await this.storage.get(key);
      if (val) {
        try { setter(JSON.parse(val)); } catch { /* ignore */ }
      }
    }
  }

  login(user: TelegramLoginUser): void {
    this.webUser.set(user);
    this.storage.set('tg_web_user', JSON.stringify(user));
  }

  logout(): void {
    this.webUser.set(null);
    this.googleUser.set(null);
    this.githubUser.set(null);
    this.linkedinUser.set(null);
    this.storage.remove('tg_web_user');
    this.storage.remove('google_user');
    this.storage.remove('github_user');
    this.storage.remove('linkedin_user');
  }

  logoutProvider(provider: string): void {
    if (provider === 'telegram') {
      this.webUser.set(null);
      this.storage.remove('tg_web_user');
    } else if (provider === 'google') {
      this.googleUser.set(null);
      this.storage.remove('google_user');
    } else if (provider === 'github') {
      this.githubUser.set(null);
      this.storage.remove('github_user');
    } else if (provider === 'linkedin') {
      this.linkedinUser.set(null);
      this.storage.remove('linkedin_user');
    }
  }

  getAuthPayload(): (TelegramLoginUser | { type: 'auth'; provider: string; code: string }) | null {
    const li = this.linkedinUser();
    if (li) return { type: 'auth', provider: 'linkedin', code: li.code };
    const gh = this.githubUser();
    if (gh) return { type: 'auth', provider: 'github', code: gh.code };
    const g = this.googleUser();
    if (g) return { type: 'auth', provider: 'google', code: g.code };
    return this.webUser();
  }

  getGoogleAuthPayload(): { provider: 'google'; code: string } | null {
    const g = this.googleUser();
    if (!g) return null;
    return { provider: 'google', code: g.code };
  }

  openTelegramLogin(): void {
    const tgLogin = (window as any).Telegram?.Login;
    if (!tgLogin) { this.authFailed.update(n => n + 1); return; }
    tgLogin.auth(
      { bot_id: environment.botId, request_access: 'write' },
      (data: TelegramLoginUser | false) => {
        if (data) {
          this.login(data);
        } else {
          this.authFailed.update(n => n + 1);
        }
      },
    );
  }

  loginWithGoogle(): void {
    // On native, Google Sign-In SDK is not available; use browser-based OAuth
    if (Capacitor.isNativePlatform()) {
      this.loginWithGoogleNative();
      return;
    }

    if (typeof google === 'undefined' || !google.accounts?.oauth2) { this.authFailed.update(n => n + 1); return; }
    if (!this.googleClientId) { this.authFailed.update(n => n + 1); return; }

    const codeClient = google.accounts.oauth2.initCodeClient({
      client_id: this.googleClientId,
      scope: 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar',
      ux_mode: 'popup',
      callback: (response: { code: string; error?: string }) => {
        if (response.error || !response.code) { this.authFailed.update(n => n + 1); return; }
        const user: GoogleUser = {
          provider: 'google',
          code: response.code,
          email: '',
          name: '',
        };
        this.googleUser.set(user);
        this.storage.set('google_user', JSON.stringify(user));
      },
    });
    codeClient.requestCode();
  }

  private loginWithGoogleNative(): void {
    const routerUrl = environment.routerUrl;
    if (!routerUrl) { this.authFailed.update(n => n + 1); return; }
    const state = crypto.randomUUID();
    this.storage.set('google_oauth_state', state);
    Browser.open({
      url: `${routerUrl}/auth/google/start?state=${encodeURIComponent(state)}&redirect=native`,
    });
  }

  loginWithGithub(): void {
    const routerUrl = environment.routerUrl;
    if (!routerUrl) { this.authFailed.update(n => n + 1); return; }

    const state = crypto.randomUUID();
    this.storage.set('github_oauth_state', state);

    // Native: open in-app browser; OAuth completes via deep link callback
    if (Capacitor.isNativePlatform()) {
      Browser.open({
        url: `${routerUrl}/auth/github/start?state=${encodeURIComponent(state)}&redirect=native`,
      });
      return;
    }

    // Web: popup flow
    const popup = window.open(
      `${routerUrl}/auth/github/start?state=${encodeURIComponent(state)}`,
      'github_auth',
      'width=600,height=700,left=200,top=100',
    );

    if (!popup) { this.authFailed.update(n => n + 1); return; }

    const popupPoll = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupPoll);
        setTimeout(() => { if (!this.githubUser()) this.authFailed.update(n => n + 1); }, 500);
      }
    }, 500);

    if (this.ghStorageHandler) {
      window.removeEventListener('storage', this.ghStorageHandler);
      this.ghStorageHandler = null;
    }
    if (this.ghStorageTimeout) {
      clearTimeout(this.ghStorageTimeout);
      this.ghStorageTimeout = null;
    }

    const cleanup = () => {
      window.removeEventListener('storage', handler);
      this.ghStorageHandler = null;
      if (this.ghStorageTimeout) { clearTimeout(this.ghStorageTimeout); this.ghStorageTimeout = null; }
    };
    const handler = (event: StorageEvent) => {
      if (event.key === 'github_auth' && event.newValue) {
        cleanup();
        try {
          const data = JSON.parse(event.newValue);
          localStorage.removeItem('github_auth');
          const savedState = sessionStorage.getItem('github_oauth_state');
          sessionStorage.removeItem('github_oauth_state');
          if (!savedState || data.state !== savedState) return;
          if (data.code) {
            const user: GitHubUser = { provider: 'github', code: data.code };
            this.githubUser.set(user);
            this.storage.set('github_user', JSON.stringify(user));
          }
        } catch { /* ignore */ }
      }
    };
    this.ghStorageHandler = handler;
    window.addEventListener('storage', handler);
    this.ghStorageTimeout = setTimeout(cleanup, 60000);
  }

  loginWithLinkedin(): void {
    const routerUrl = environment.routerUrl;
    if (!routerUrl) { this.authFailed.update(n => n + 1); return; }

    const state = crypto.randomUUID();
    this.storage.set('linkedin_oauth_state', state);

    // Native: open in-app browser; OAuth completes via deep link callback
    if (Capacitor.isNativePlatform()) {
      Browser.open({
        url: `${routerUrl}/auth/linkedin/start?state=${encodeURIComponent(state)}&redirect=native`,
      });
      return;
    }

    // Web: popup flow
    const popup = window.open(
      `${routerUrl}/auth/linkedin/start?state=${encodeURIComponent(state)}`,
      'linkedin_auth',
      'width=600,height=700,left=200,top=100',
    );

    if (!popup) { this.authFailed.update(n => n + 1); return; }

    const popupPoll = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupPoll);
        setTimeout(() => { if (!this.linkedinUser()) this.authFailed.update(n => n + 1); }, 500);
      }
    }, 500);

    if (this.liStorageHandler) {
      window.removeEventListener('storage', this.liStorageHandler);
      this.liStorageHandler = null;
    }
    if (this.liStorageTimeout) {
      clearTimeout(this.liStorageTimeout);
      this.liStorageTimeout = null;
    }

    const cleanup = () => {
      window.removeEventListener('storage', handler);
      this.liStorageHandler = null;
      if (this.liStorageTimeout) { clearTimeout(this.liStorageTimeout); this.liStorageTimeout = null; }
    };
    const handler = (event: StorageEvent) => {
      if (event.key === 'linkedin_auth' && event.newValue) {
        cleanup();
        try {
          const data = JSON.parse(event.newValue);
          localStorage.removeItem('linkedin_auth');
          const savedState = sessionStorage.getItem('linkedin_oauth_state');
          sessionStorage.removeItem('linkedin_oauth_state');
          if (!savedState || data.state !== savedState) return;
          if (data.code) {
            const user: LinkedInUser = { provider: 'linkedin', code: data.code };
            this.linkedinUser.set(user);
            this.storage.set('linkedin_user', JSON.stringify(user));
          }
        } catch { /* ignore */ }
      }
    };
    this.liStorageHandler = handler;
    window.addEventListener('storage', handler);
    this.liStorageTimeout = setTimeout(cleanup, 60000);
  }

  /** Called by DeepLinkService when a native OAuth callback deep link is received. */
  completeNativeOAuth(provider: 'github' | 'linkedin', code: string, state: string | null): void {
    Browser.close().catch(() => {});
    if (provider === 'github') {
      this.storage.get('github_oauth_state').then(savedState => {
        this.storage.remove('github_oauth_state');
        if (!savedState || state !== savedState) return;
        const user: GitHubUser = { provider: 'github', code };
        this.githubUser.set(user);
        this.storage.set('github_user', JSON.stringify(user));
      });
    } else if (provider === 'linkedin') {
      this.storage.get('linkedin_oauth_state').then(savedState => {
        this.storage.remove('linkedin_oauth_state');
        if (!savedState || state !== savedState) return;
        const user: LinkedInUser = { provider: 'linkedin', code };
        this.linkedinUser.set(user);
        this.storage.set('linkedin_user', JSON.stringify(user));
      });
    }
  }

  hasLinkedProvider(provider: 'telegram' | 'google' | 'github' | 'linkedin'): boolean {
    if (provider === 'telegram') return !!this.webUser();
    if (provider === 'google') return !!this.googleUser();
    if (provider === 'github') return !!this.githubUser();
    if (provider === 'linkedin') return !!this.linkedinUser();
    return false;
  }
}
