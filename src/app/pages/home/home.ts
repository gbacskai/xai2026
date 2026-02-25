import { Component, inject, OnInit, computed, signal } from '@angular/core';
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
export class HomePage implements OnInit {
  private router = inject(Router);
  private chat = inject(ChatService);
  tg = inject(TelegramService);
  auth = inject(AuthService);
  i18n = inject(I18nService);

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
    this.chat.sendLinkRequest('telegram');
  }

  linkGoogle() {
    this.auth.loginWithGoogle();
    const check = () => {
      const g = this.auth.getGoogleAuthPayload();
      if (g) {
        this.chat.sendLinkProvider('google', { code: g.code });
      } else {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 1000);
  }

  linkGithub() {
    this.auth.loginWithGithub();
    const check = () => {
      const gh = this.auth.githubUser();
      if (gh) {
        this.chat.sendLinkProvider('github', { code: gh.code });
      } else {
        setTimeout(check, 500);
      }
    };
    setTimeout(check, 1000);
  }

  logoutProvider(provider: string) {
    this.auth.logoutProvider(provider);
  }
}
