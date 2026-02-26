import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../environments/environment';

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

declare const google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly webUser = signal<TelegramLoginUser | null>(null);
  readonly googleUser = signal<GoogleUser | null>(null);
  readonly githubUser = signal<GitHubUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.webUser() || !!this.googleUser() || !!this.githubUser());
  readonly currentProvider = computed<'telegram' | 'google' | 'github' | null>(() => {
    if (this.githubUser()) return 'github';
    if (this.googleUser()) return 'google';
    if (this.webUser()) return 'telegram';
    return null;
  });

  private readonly botId = environment.botId;
  private googleClientId = '';

  private ghStorageHandler: ((event: StorageEvent) => void) | null = null;
  private ghStorageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Fetch public config (Google client ID) from the router
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 5000);
    fetch(`${environment.routerUrl}/config`, { signal: controller.signal })
      .then(r => r.json())
      .then(cfg => { this.googleClientId = cfg.googleClientId || ''; })
      .catch(() => { /* router unreachable — Google login will be unavailable */ })
      .finally(() => clearTimeout(fetchTimeout));

    const stored = sessionStorage.getItem('tg_web_user');
    if (stored) {
      try {
        this.webUser.set(JSON.parse(stored));
      } catch { /* ignore corrupt data */ }
    }
    const googleStored = sessionStorage.getItem('google_user');
    if (googleStored) {
      try {
        this.googleUser.set(JSON.parse(googleStored));
      } catch { /* ignore corrupt data */ }
    }
    const githubStored = sessionStorage.getItem('github_user');
    if (githubStored) {
      try {
        this.githubUser.set(JSON.parse(githubStored));
      } catch { /* ignore corrupt data */ }
    }
  }

  login(user: TelegramLoginUser): void {
    this.webUser.set(user);
    sessionStorage.setItem('tg_web_user', JSON.stringify(user));
  }

  logout(): void {
    this.webUser.set(null);
    this.googleUser.set(null);
    this.githubUser.set(null);
    sessionStorage.removeItem('tg_web_user');
    sessionStorage.removeItem('google_user');
    sessionStorage.removeItem('github_user');
  }

  logoutProvider(provider: string): void {
    if (provider === 'telegram') {
      this.webUser.set(null);
      sessionStorage.removeItem('tg_web_user');
    } else if (provider === 'google') {
      this.googleUser.set(null);
      sessionStorage.removeItem('google_user');
    } else if (provider === 'github') {
      this.githubUser.set(null);
      sessionStorage.removeItem('github_user');
    }
  }

  getAuthPayload(): (TelegramLoginUser | { type: 'auth'; provider: 'google'; code: string } | { type: 'auth'; provider: 'github'; code: string }) | null {
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
    if (tgLogin) {
      tgLogin.auth(
        { bot_id: environment.botId, request_access: 'write' },
        (data: TelegramLoginUser | false) => {
          if (data) {
            this.login(data);
          }
        },
      );
    }
  }

  loginWithGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts?.oauth2) return;
    if (!this.googleClientId) return;

    const codeClient = google.accounts.oauth2.initCodeClient({
      client_id: this.googleClientId,
      scope: 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar',
      ux_mode: 'popup',
      callback: (response: { code: string; error?: string }) => {
        if (response.error || !response.code) return;
        // We only have the auth code — email/name will come from the backend after token exchange.
        // Store a minimal GoogleUser so the WS auth payload can be built.
        const user: GoogleUser = {
          provider: 'google',
          code: response.code,
          email: '',
          name: '',
        };
        this.googleUser.set(user);
        sessionStorage.setItem('google_user', JSON.stringify(user));
      },
    });
    codeClient.requestCode();
  }

  loginWithGithub(): void {
    const routerUrl = environment.routerUrl;
    if (!routerUrl) return;

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('github_oauth_state', state);

    window.open(
      `${routerUrl}/auth/github/start?state=${encodeURIComponent(state)}`,
      'github_auth',
      'width=600,height=700,left=200,top=100',
    );

    // Remove previous listener if still active
    if (this.ghStorageHandler) {
      window.removeEventListener('storage', this.ghStorageHandler);
      this.ghStorageHandler = null;
    }
    if (this.ghStorageTimeout) {
      clearTimeout(this.ghStorageTimeout);
      this.ghStorageTimeout = null;
    }

    // The OAuth callback redirects to /github-auth.html on our origin,
    // which writes the code to localStorage. Listen for that storage event.
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
          // Verify state matches
          const savedState = sessionStorage.getItem('github_oauth_state');
          sessionStorage.removeItem('github_oauth_state');
          if (!savedState || data.state !== savedState) return;
          if (data.code) {
            const user: GitHubUser = { provider: 'github', code: data.code };
            this.githubUser.set(user);
            sessionStorage.setItem('github_user', JSON.stringify(user));
          }
        } catch { /* ignore */ }
      }
    };
    this.ghStorageHandler = handler;
    window.addEventListener('storage', handler);
    // Auto-remove after 60s
    this.ghStorageTimeout = setTimeout(cleanup, 60000);
  }

  hasLinkedProvider(provider: 'telegram' | 'google' | 'github'): boolean {
    if (provider === 'telegram') return !!this.webUser();
    if (provider === 'google') return !!this.googleUser();
    if (provider === 'github') return !!this.githubUser();
    return false;
  }
}
