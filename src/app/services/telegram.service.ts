import { Injectable, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

  private initialized = false;
  private backCallback: (() => void) | null = null;

  init() {
    if (!this.isTelegram) return;
    if (this.initialized) return;
    this.initialized = true;
    this.webapp!.ready();
    this.webapp!.expand();

    this.webapp!.onEvent('themeChanged', () => {
      this.colorScheme.set(this.webapp!.colorScheme);
    });
  }

  showBackButton(callback: () => void) {
    if (!this.isTelegram) return;
    if (this.backCallback) {
      this.webapp!.BackButton.offClick(this.backCallback);
    }
    this.backCallback = callback;
    this.webapp!.BackButton.onClick(callback);
    this.webapp!.BackButton.show();
  }

  hideBackButton() {
    if (!this.isTelegram) return;
    if (this.backCallback) {
      this.webapp!.BackButton.offClick(this.backCallback);
      this.backCallback = null;
    }
    this.webapp!.BackButton.hide();
  }

  haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (this.isTelegram) {
      this.webapp!.HapticFeedback.impactOccurred(type);
    } else if (Capacitor.isNativePlatform()) {
      const style =
        type === 'heavy' ? ImpactStyle.Heavy : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
      Haptics.impact({ style });
    }
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
