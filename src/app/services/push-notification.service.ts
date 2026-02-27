import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { PlatformService } from './platform.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private platform = inject(PlatformService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private deviceToken: string | null = null;

  async initialize(): Promise<void> {
    if (!this.platform.isNative) return;

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token: Token) => {
      this.ngZone.run(() => {
        this.deviceToken = token.value;
        console.log('[Push] Device token:', token.value);
      });
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (_notification: PushNotificationSchema) => {
        // Notification received while app is in foreground — could show an in-app toast
      },
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.ngZone.run(() => {
          const data = action.notification.data;
          if (data?.deepLink) {
            this.router.navigateByUrl(data.deepLink);
          }
        });
      },
    );
  }

  /** Send the stored device token to the backend. Call after auth is established. */
  async sendTokenToBackend(sessionToken: string): Promise<void> {
    if (!this.deviceToken || !sessionToken) return;
    try {
      await fetch(`${environment.routerUrl}/api/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          token: this.deviceToken,
          platform: this.platform.platform,
        }),
      });
    } catch (err) {
      console.error('[Push] Failed to send token:', err);
    }
  }
}
