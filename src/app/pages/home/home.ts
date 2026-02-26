import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { I18nService, LOCALE_LABELS } from '../../i18n/i18n.service';
import { FullArticle, SupportedLocale, SUPPORTED_LOCALES } from '../../i18n/i18n.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private chat = inject(ChatService);
  tg = inject(TelegramService);
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private linkTimers: ReturnType<typeof setTimeout>[] = [];

  locales = SUPPORTED_LOCALES;
  localeLabels = LOCALE_LABELS;
  langOpen = signal(false);
  isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  linkedProviders = computed(() => {
    const list: { key: string; label: string }[] = [];
    if (this.auth.webUser()) list.push({ key: 'telegram', label: 'Telegram' });
    if (this.auth.googleUser()) list.push({ key: 'google', label: 'Google' });
    if (this.auth.githubUser()) list.push({ key: 'github', label: 'GitHub' });
    return list;
  });

  gettingStarted = computed(() => this.i18n.articles().filter(a => a.category === 'getting-started'));
  features = computed(() => this.i18n.articles().filter(a => a.category === 'features'));
  guides = computed(() => this.i18n.articles().filter(a => a.category === 'guides'));

  ngOnInit() {
    this.tg.hideBackButton();
  }

  ngOnDestroy() {
    this.linkTimers.forEach(t => clearTimeout(t));
  }

  private pollUntil(check: () => boolean, onSuccess: () => void, maxAttempts = 60) {
    let attempts = 0;
    const poll = () => {
      if (check()) { onSuccess(); return; }
      if (++attempts >= maxAttempts) return;
      this.linkTimers.push(setTimeout(poll, 500));
    };
    this.linkTimers.push(setTimeout(poll, 1000));
  }

  open(article: FullArticle) {
    this.tg.haptic();
    this.router.navigate(['/article', article.id]);
  }

  toggleLang() {
    this.langOpen.update(v => !v);
  }

  selectLang(loc: SupportedLocale) {
    this.tg.haptic();
    this.i18n.setLocale(loc);
    this.langOpen.set(false);
  }

  loginWithTelegram() {
    this.auth.openTelegramLogin();
  }

  loginWithGoogle() {
    this.auth.loginWithGoogle();
  }

  loginWithGithub() {
    this.auth.loginWithGithub();
  }

  linkTelegram() {
    this.auth.openTelegramLogin();
    this.pollUntil(
      () => !!this.auth.webUser(),
      () => this.chat.sendLinkProvider('telegram', { ...this.auth.webUser()! }),
    );
  }

  linkGoogle() {
    this.auth.loginWithGoogle();
    this.pollUntil(
      () => !!this.auth.getGoogleAuthPayload(),
      () => this.chat.sendLinkProvider('google', { code: this.auth.getGoogleAuthPayload()!.code }),
    );
  }

  linkGithub() {
    this.auth.loginWithGithub();
    this.pollUntil(
      () => !!this.auth.githubUser(),
      () => this.chat.sendLinkProvider('github', { code: this.auth.githubUser()!.code }),
    );
  }

  logoutProvider(provider: string) {
    this.auth.logoutProvider(provider);
  }
}
