import { Injectable, inject, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resendSignUpCode,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
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

export interface CognitoUser {
  provider: 'email' | 'google' | 'linkedin' | 'github' | 'telegram';
  sub: string;
  email: string;
  name?: string;
  idToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);
  private platformSvc = inject(PlatformService);

  readonly webUser = signal<TelegramLoginUser | null>(null);
  readonly cognitoUser = signal<CognitoUser | null>(null);

  readonly authState = signal<'idle' | 'loading' | 'signIn' | 'signUp' | 'confirm' | 'forgot' | 'reset'>('signIn');
  readonly authError = signal<string | null>(null);

  /** Incremented whenever an auth attempt fails or is cancelled */
  readonly authFailed = signal(0);
  readonly isAuthenticated = computed(() => !!this.cognitoUser() || !!this.webUser());
  readonly currentProvider = computed<'email' | 'google' | 'linkedin' | 'github' | 'telegram' | null>(() => {
    const cu = this.cognitoUser();
    if (cu) return cu.provider;
    if (this.webUser()) return 'telegram';
    return null;
  });

  private readonly botId = environment.botId;

  constructor() {
    // Listen for Amplify Hub auth events (redirect completions)
    Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        this.checkSession();
      }
      if (payload.event === 'signInWithRedirect_failure') {
        this.authFailed.update(n => n + 1);
      }
    });

    // Check for existing Cognito session on startup
    this.checkSession();

    // Restore Telegram session from storage (for Telegram WebApp context)
    if (this.platformSvc.isNative) {
      this.restoreTelegramSessionAsync();
    } else {
      this.restoreTelegramSessionSync();
    }
  }

  private restoreTelegramSessionSync(): void {
    const stored = sessionStorage.getItem('tg_web_user');
    if (stored) {
      try { this.webUser.set(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }

  private async restoreTelegramSessionAsync(): Promise<void> {
    const val = await this.storage.get('tg_web_user');
    if (val) {
      try { this.webUser.set(JSON.parse(val)); } catch { /* ignore */ }
    }
  }

  /** Check for existing Cognito session and restore cognitoUser signal */
  async checkSession(): Promise<void> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!user || !idToken) return;

      const payload = session.tokens?.idToken?.payload as Record<string, any> | undefined;
      const email = (payload?.['email'] as string) || '';
      const name = (payload?.['name'] as string) || '';

      // Determine provider from Cognito identities
      const identities = payload?.['identities'] as Array<{ providerName: string }> | undefined;
      let provider: CognitoUser['provider'] = 'email';
      if (identities?.length) {
        const p = identities[0].providerName.toLowerCase();
        if (p.includes('google')) provider = 'google';
        else if (p.includes('linkedin')) provider = 'linkedin';
        else if (p.includes('github')) provider = 'github';
        else if (p.includes('telegram')) provider = 'telegram';
      }

      this.cognitoUser.set({ provider, sub: user.userId, email, name, idToken });
      this.authState.set('idle');
      this.authError.set(null);
    } catch {
      // No active session — that's fine
    }
  }

  /** Get a fresh ID token (refreshes if expired) */
  async getFreshIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const idToken = session.tokens?.idToken?.toString() || null;
      if (idToken) {
        const cu = this.cognitoUser();
        if (cu) {
          this.cognitoUser.set({ ...cu, idToken });
        }
      }
      return idToken;
    } catch {
      return null;
    }
  }

  getAuthPayload(): (TelegramLoginUser | { type: 'auth'; provider: string; code: string }) | null {
    const cu = this.cognitoUser();
    if (cu) return { type: 'auth', provider: cu.provider, code: cu.idToken };
    return this.webUser();
  }

  // ── Email/password methods ──

  async signInWithEmail(email: string, password: string): Promise<void> {
    this.authState.set('loading');
    this.authError.set(null);
    try {
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        await this.checkSession();
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        this.authState.set('confirm');
      }
    } catch (err: any) {
      this.authState.set('signIn');
      this.authError.set(err.message || 'Sign in failed');
      this.authFailed.update(n => n + 1);
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<void> {
    this.authState.set('loading');
    this.authError.set(null);
    try {
      const result = await signUp({ username: email, password, options: { userAttributes: { email } } });
      if (result.isSignUpComplete) {
        // Auto-confirm (unlikely without verification), try sign in
        await this.signInWithEmail(email, password);
      } else {
        this.authState.set('confirm');
      }
    } catch (err: any) {
      this.authState.set('signUp');
      this.authError.set(err.message || 'Sign up failed');
      this.authFailed.update(n => n + 1);
    }
  }

  async confirmSignUpCode(email: string, code: string): Promise<void> {
    this.authState.set('loading');
    this.authError.set(null);
    try {
      const result = await confirmSignUp({ username: email, confirmationCode: code });
      if (result.isSignUpComplete) {
        this.authState.set('signIn');
      }
    } catch (err: any) {
      this.authState.set('confirm');
      this.authError.set(err.message || 'Verification failed');
    }
  }

  async resendSignUpCode(email: string): Promise<void> {
    try {
      await resendSignUpCode({ username: email });
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to resend code');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    this.authState.set('loading');
    this.authError.set(null);
    try {
      await resetPassword({ username: email });
      this.authState.set('reset');
    } catch (err: any) {
      this.authState.set('forgot');
      this.authError.set(err.message || 'Failed to send reset code');
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    this.authState.set('loading');
    this.authError.set(null);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      this.authState.set('signIn');
    } catch (err: any) {
      this.authState.set('reset');
      this.authError.set(err.message || 'Password reset failed');
    }
  }

  // ── Social login methods ──

  signInWithGoogle(): void {
    try {
      signInWithRedirect({ provider: 'Google' });
    } catch {
      this.authFailed.update(n => n + 1);
    }
  }

  signInWithLinkedin(): void {
    try {
      signInWithRedirect({ provider: { custom: 'LinkedIn' } });
    } catch {
      this.authFailed.update(n => n + 1);
    }
  }

  loginWithGithub(): void {
    const routerUrl = environment.routerUrl;
    if (!routerUrl) { this.authFailed.update(n => n + 1); return; }

    const state = crypto.randomUUID();
    this.storage.set('github_oauth_state', state);

    // Native: open in-app browser; backend exchanges code → returns Cognito tokens
    if (Capacitor.isNativePlatform()) {
      Browser.open({
        url: `${routerUrl}/auth/github/start?state=${encodeURIComponent(state)}&redirect=native`,
      });
      return;
    }

    // Web: popup flow → backend returns Cognito tokens
    const popup = window.open(
      `${routerUrl}/auth/github/start?state=${encodeURIComponent(state)}`,
      'github_auth',
      'width=600,height=700,left=200,top=100',
    );

    if (!popup) { this.authFailed.update(n => n + 1); return; }

    const popupPoll = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupPoll);
        setTimeout(() => { if (!this.cognitoUser()) this.authFailed.update(n => n + 1); }, 500);
      }
    }, 500);

    const cleanup = () => {
      window.removeEventListener('storage', handler);
      if (storageTimeout) clearTimeout(storageTimeout);
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
          if (data.idToken) {
            // Backend returned Cognito tokens
            this.cognitoUser.set({
              provider: 'github',
              sub: data.sub || '',
              email: data.email || '',
              name: data.name || '',
              idToken: data.idToken,
            });
            this.authState.set('idle');
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    const storageTimeout = setTimeout(cleanup, 60000);
  }

  // ── Telegram login ──

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

  login(user: TelegramLoginUser): void {
    this.webUser.set(user);
    this.storage.set('tg_web_user', JSON.stringify(user));
  }

  // ── Logout ──

  async logout(): Promise<void> {
    try { await signOut(); } catch { /* ignore */ }
    this.cognitoUser.set(null);
    this.webUser.set(null);
    this.storage.remove('tg_web_user');
    this.authState.set('signIn');
    this.authError.set(null);
  }

  logoutProvider(provider: string): void {
    if (provider === 'telegram') {
      this.webUser.set(null);
      this.storage.remove('tg_web_user');
    } else {
      // For Cognito-backed providers, full sign out
      this.logout();
    }
  }

  /** Called by DeepLinkService when a native OAuth callback deep link is received. */
  completeNativeOAuth(provider: 'github' | 'linkedin', code: string, state: string | null): void {
    Browser.close().catch(() => {});
    if (provider === 'github') {
      // GitHub native callback returns Cognito tokens from backend
      this.storage.get('github_oauth_state').then(savedState => {
        this.storage.remove('github_oauth_state');
        if (!savedState || state !== savedState) return;
        // The code here is actually a Cognito idToken returned by backend
        this.cognitoUser.set({
          provider: 'github',
          sub: '',
          email: '',
          idToken: code,
        });
        this.authState.set('idle');
      });
    }
    // LinkedIn is handled by Cognito redirect via Amplify, so no manual handling needed
  }

  /** Called by DeepLinkService to handle Cognito OAuth callback on native */
  handleCognitoCallback(): void {
    // Amplify handles the token exchange automatically via Hub listener
    this.checkSession();
  }

  hasLinkedProvider(provider: 'telegram' | 'google' | 'github' | 'linkedin' | 'email'): boolean {
    if (provider === 'telegram') return !!this.webUser();
    const cu = this.cognitoUser();
    if (cu && cu.provider === provider) return true;
    return false;
  }
}
