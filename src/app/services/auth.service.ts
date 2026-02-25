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

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly webUser = signal<TelegramLoginUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.webUser());

  private readonly botId = environment.botId;

  constructor() {
    const stored = sessionStorage.getItem('tg_web_user');
    if (stored) {
      try {
        this.webUser.set(JSON.parse(stored));
      } catch { /* ignore corrupt data */ }
    }
  }

  login(user: TelegramLoginUser): void {
    this.webUser.set(user);
    sessionStorage.setItem('tg_web_user', JSON.stringify(user));
  }

  logout(): void {
    this.webUser.set(null);
    sessionStorage.removeItem('tg_web_user');
  }

  getAuthPayload(): { id: number; first_name: string; hash: string; auth_date: number } | null {
    const u = this.webUser();
    if (!u) return null;
    return { id: u.id, first_name: u.first_name, hash: u.hash, auth_date: u.auth_date };
  }

  openTelegramLogin(): void {
    // Use the Telegram Login Widget's programmatic API
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
}
