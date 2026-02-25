import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly webapp = window.Telegram?.WebApp;
  readonly isTelegram = !!this.webapp?.initData;
  readonly user = signal(this.webapp?.initDataUnsafe?.user ?? null);
  readonly colorScheme = signal<'light' | 'dark'>(this.webapp?.colorScheme ?? 'light');
  readonly startParam = signal(this.webapp?.initDataUnsafe?.start_param ?? null);
  readonly platform = signal(this.webapp?.platform ?? 'web');
  readonly userName = computed(() => {
    const u = this.user();
    return u ? (u.first_name + (u.last_name ? ' ' + u.last_name : '')) : 'there';
  });

  init() {
    if (!this.isTelegram) return;
    this.webapp!.ready();
    this.webapp!.expand();

    this.webapp!.onEvent('themeChanged', () => {
      this.colorScheme.set(this.webapp!.colorScheme);
    });
  }

  showBackButton(callback: () => void) {
    if (!this.isTelegram) return;
    this.webapp!.BackButton.onClick(callback);
    this.webapp!.BackButton.show();
  }

  hideBackButton() {
    if (!this.isTelegram) return;
    this.webapp!.BackButton.hide();
  }

  haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!this.isTelegram) return;
    this.webapp!.HapticFeedback.impactOccurred(type);
  }

  showAlert(message: string, callback?: () => void) {
    if (this.webapp) {
      this.webapp.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }

  close() {
    this.webapp?.close();
  }
}
