import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';
import { Preferences } from '@capacitor/preferences';

/**
 * Abstracts storage across web (sessionStorage) and native (@capacitor/preferences).
 * On native, sessionStorage is unreliable across app restarts; Preferences persists reliably.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private platform = inject(PlatformService);

  async get(key: string): Promise<string | null> {
    if (this.platform.isNative) {
      const result = await Preferences.get({ key });
      return result.value;
    }
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.platform.isNative) {
      await Preferences.set({ key, value });
    } else {
      sessionStorage.setItem(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    if (this.platform.isNative) {
      await Preferences.remove({ key });
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  }

  /** Synchronous getter — only works on web. Native callers must use async get(). */
  getSync(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  /** Synchronous setter — only works on web. Native callers must use async set(). */
  setSync(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  /** Synchronous remover — only works on web. Native callers must use async remove(). */
  removeSync(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
