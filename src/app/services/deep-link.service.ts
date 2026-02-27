import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { PlatformService } from './platform.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DeepLinkService {
  private platform = inject(PlatformService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private ngZone = inject(NgZone);

  initialize(): void {
    if (!this.platform.isNative) return;

    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.ngZone.run(() => {
        this.handleUrl(event.url);
      });
    });
  }

  private handleUrl(url: string): void {
    try {
      const parsed = new URL(url);

      // Handle invite deep links: https://xaiworkspace.com/invite?code=xxx
      if (parsed.pathname.startsWith('/invite')) {
        const code = parsed.searchParams.get('code');
        this.router.navigate(['/invite'], { queryParams: code ? { code } : {} });
        return;
      }

      // Handle OAuth callbacks: xaiworkspace://oauth?provider=github&code=xxx&state=yyy
      if (parsed.hostname === 'oauth' || parsed.pathname.startsWith('/oauth')) {
        const provider = parsed.searchParams.get('provider');
        const code = parsed.searchParams.get('code');
        const state = parsed.searchParams.get('state');
        if (provider && code) {
          this.auth.completeNativeOAuth(
            provider as 'github' | 'linkedin',
            code,
            state,
          );
        }
        return;
      }

      // Generic: route based on pathname
      const path = parsed.pathname;
      if (path && path !== '/') {
        this.router.navigateByUrl(path + parsed.search);
      }
    } catch {
      // Invalid URL — ignore
    }
  }
}
