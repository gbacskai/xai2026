import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';
import { AuthService } from '../../services/auth.service';
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
  tg = inject(TelegramService);
  auth = inject(AuthService);
  i18n = inject(I18nService);

  locales = SUPPORTED_LOCALES;
  localeLabels = LOCALE_LABELS;
  langOpen = signal(false);

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
}
