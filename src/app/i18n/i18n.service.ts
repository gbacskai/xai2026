import { Injectable, signal, computed } from '@angular/core';
import { SupportedLocale, UiStrings, FullArticle, ArticleMeta, LocalizedArticle } from './i18n.types';
import { ARTICLE_META } from '../data/articles';

// UI strings
import { EN } from './ui/en';
import { ZH } from './ui/zh';
import { ES } from './ui/es';
import { AR } from './ui/ar';
import { PT_BR } from './ui/pt-BR';
import { DE } from './ui/de';
import { FR } from './ui/fr';
import { JA } from './ui/ja';
import { RU } from './ui/ru';
import { HI } from './ui/hi';

// Article content
import { ARTICLES_EN } from './content/articles/en';
import { ARTICLES_ZH } from './content/articles/zh';
import { ARTICLES_ES } from './content/articles/es';
import { ARTICLES_AR } from './content/articles/ar';
import { ARTICLES_PT_BR } from './content/articles/pt-BR';
import { ARTICLES_DE } from './content/articles/de';
import { ARTICLES_FR } from './content/articles/fr';
import { ARTICLES_JA } from './content/articles/ja';
import { ARTICLES_RU } from './content/articles/ru';
import { ARTICLES_HI } from './content/articles/hi';

// Privacy content
import { PRIVACY_EN } from './content/privacy/en';
import { PRIVACY_ZH } from './content/privacy/zh';
import { PRIVACY_ES } from './content/privacy/es';
import { PRIVACY_AR } from './content/privacy/ar';
import { PRIVACY_PT_BR } from './content/privacy/pt-BR';
import { PRIVACY_DE } from './content/privacy/de';
import { PRIVACY_FR } from './content/privacy/fr';
import { PRIVACY_JA } from './content/privacy/ja';
import { PRIVACY_RU } from './content/privacy/ru';
import { PRIVACY_HI } from './content/privacy/hi';

// Terms content
import { TERMS_EN } from './content/terms/en';
import { TERMS_ZH } from './content/terms/zh';
import { TERMS_ES } from './content/terms/es';
import { TERMS_AR } from './content/terms/ar';
import { TERMS_PT_BR } from './content/terms/pt-BR';
import { TERMS_DE } from './content/terms/de';
import { TERMS_FR } from './content/terms/fr';
import { TERMS_JA } from './content/terms/ja';
import { TERMS_RU } from './content/terms/ru';
import { TERMS_HI } from './content/terms/hi';

// Authorize content
import { AUTHORIZE_EN } from './content/authorize/en';
import { AUTHORIZE_ZH } from './content/authorize/zh';
import { AUTHORIZE_ES } from './content/authorize/es';
import { AUTHORIZE_AR } from './content/authorize/ar';
import { AUTHORIZE_PT_BR } from './content/authorize/pt-BR';
import { AUTHORIZE_DE } from './content/authorize/de';
import { AUTHORIZE_FR } from './content/authorize/fr';
import { AUTHORIZE_JA } from './content/authorize/ja';
import { AUTHORIZE_RU } from './content/authorize/ru';
import { AUTHORIZE_HI } from './content/authorize/hi';

const UI_STRINGS: Record<SupportedLocale, UiStrings> = {
  en: EN, zh: ZH, es: ES, ar: AR, 'pt-BR': PT_BR,
  de: DE, fr: FR, ja: JA, ru: RU, hi: HI,
};

const ARTICLE_CONTENT: Record<SupportedLocale, Record<string, LocalizedArticle>> = {
  en: ARTICLES_EN, zh: ARTICLES_ZH, es: ARTICLES_ES, ar: ARTICLES_AR, 'pt-BR': ARTICLES_PT_BR,
  de: ARTICLES_DE, fr: ARTICLES_FR, ja: ARTICLES_JA, ru: ARTICLES_RU, hi: ARTICLES_HI,
};

const PRIVACY_CONTENT: Record<SupportedLocale, string> = {
  en: PRIVACY_EN, zh: PRIVACY_ZH, es: PRIVACY_ES, ar: PRIVACY_AR, 'pt-BR': PRIVACY_PT_BR,
  de: PRIVACY_DE, fr: PRIVACY_FR, ja: PRIVACY_JA, ru: PRIVACY_RU, hi: PRIVACY_HI,
};

const TERMS_CONTENT: Record<SupportedLocale, string> = {
  en: TERMS_EN, zh: TERMS_ZH, es: TERMS_ES, ar: TERMS_AR, 'pt-BR': TERMS_PT_BR,
  de: TERMS_DE, fr: TERMS_FR, ja: TERMS_JA, ru: TERMS_RU, hi: TERMS_HI,
};

const AUTHORIZE_CONTENT: Record<SupportedLocale, string> = {
  en: AUTHORIZE_EN, zh: AUTHORIZE_ZH, es: AUTHORIZE_ES, ar: AUTHORIZE_AR, 'pt-BR': AUTHORIZE_PT_BR,
  de: AUTHORIZE_DE, fr: AUTHORIZE_FR, ja: AUTHORIZE_JA, ru: AUTHORIZE_RU, hi: AUTHORIZE_HI,
};

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  ar: 'العربية',
  'pt-BR': 'Português',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  ru: 'Русский',
  hi: 'हिन्दी',
};

function detectLocale(languageCode: string | undefined): SupportedLocale {
  const code = (languageCode || '').toLowerCase();
  if (!code) return 'en';
  if (code.startsWith('zh')) return 'zh';
  if (code.startsWith('pt')) return 'pt-BR';
  const base = code.split('-')[0];
  if (base in UI_STRINGS) return base as SupportedLocale;
  return 'en';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<SupportedLocale>('en');
  readonly localeLabels = LOCALE_LABELS;

  detect(): void {
    // Priority: Telegram user language > browser language > English
    const tgLang = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const detected = detectLocale(tgLang || browserLang);
    this.setLocale(detected);
  }

  setLocale(loc: SupportedLocale): void {
    this.locale.set(loc);
    document.documentElement.dir = loc === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = loc;
  }

  t(key: keyof UiStrings, vars?: Record<string, string>): string {
    const loc = this.locale();
    let text = UI_STRINGS[loc]?.[key] ?? UI_STRINGS['en'][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  }

  readonly articles = computed<FullArticle[]>(() => {
    const loc = this.locale();
    const localized = ARTICLE_CONTENT[loc] ?? ARTICLE_CONTENT['en'];
    return ARTICLE_META.map(meta => {
      const content = localized[meta.id] ?? ARTICLE_CONTENT['en'][meta.id];
      return { ...meta, ...content };
    });
  });

  getPrivacyContent(): string {
    return PRIVACY_CONTENT[this.locale()] ?? PRIVACY_CONTENT['en'];
  }

  getTermsContent(): string {
    return TERMS_CONTENT[this.locale()] ?? TERMS_CONTENT['en'];
  }

  getAuthorizeContent(): string {
    return AUTHORIZE_CONTENT[this.locale()] ?? AUTHORIZE_CONTENT['en'];
  }
}
