import { Injectable, inject, signal } from '@angular/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { PlatformService } from './platform.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private platform = inject(PlatformService);
  private storage = inject(StorageService);

  readonly isAvailable = signal(false);
  readonly biometryType = signal<BiometryType>(BiometryType.NONE);
  readonly isEnabled = signal(false);

  async initialize(): Promise<void> {
    if (!this.platform.isNative) return;

    try {
      const result = await NativeBiometric.isAvailable();
      this.isAvailable.set(result.isAvailable);
      this.biometryType.set(result.biometryType);
    } catch {
      this.isAvailable.set(false);
    }

    const enabled = await this.storage.get('biometric_enabled');
    this.isEnabled.set(enabled === 'true');
  }

  async enableBiometric(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Enable biometric unlock for xAI Workspace',
        title: 'Biometric Authentication',
      });
      await this.storage.set('biometric_enabled', 'true');
      this.isEnabled.set(true);
      return true;
    } catch {
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    await this.storage.set('biometric_enabled', 'false');
    this.isEnabled.set(false);
  }

  async verifyIdentity(): Promise<boolean> {
    if (!this.isAvailable() || !this.isEnabled()) return true;
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Unlock xAI Workspace',
        title: 'Unlock',
      });
      return true;
    } catch {
      return false;
    }
  }

  async storeCredentials(sessionToken: string): Promise<void> {
    if (!this.platform.isNative) return;
    try {
      await NativeBiometric.setCredentials({
        username: 'xaiworkspace_session',
        password: sessionToken,
        server: 'chat.xaiworkspace.com',
      });
    } catch {
      // Biometric credential storage is optional
    }
  }

  async getCredentials(): Promise<string | null> {
    if (!this.platform.isNative) return null;
    try {
      const creds = await NativeBiometric.getCredentials({
        server: 'chat.xaiworkspace.com',
      });
      return creds.password || null;
    } catch {
      return null;
    }
  }

  async deleteCredentials(): Promise<void> {
    if (!this.platform.isNative) return;
    try {
      await NativeBiometric.deleteCredentials({
        server: 'chat.xaiworkspace.com',
      });
    } catch {
      // ignore
    }
  }

  getBiometryLabel(): string {
    switch (this.biometryType()) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Fingerprint';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Face Unlock';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Iris';
      default:
        return 'Biometric';
    }
  }
}
