import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  readonly isNative = Capacitor.isNativePlatform();
  readonly platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  readonly isIOS = this.platform === 'ios';
  readonly isAndroid = this.platform === 'android';
  readonly isWeb = this.platform === 'web';
}
