export type SupportedLocale =
  | 'en' | 'zh' | 'es' | 'ar' | 'pt-BR'
  | 'de' | 'fr' | 'ja' | 'ru' | 'hi';

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  'en', 'zh', 'es', 'ar', 'pt-BR', 'de', 'fr', 'ja', 'ru', 'hi',
];

export interface UiStrings {
  'hero.greeting': string;
  'hero.inviteOnly': string;
  'section.gettingStarted': string;
  'section.features': string;
  'section.guides': string;
  'footer.company': string;
  'footer.privacy': string;
  'footer.terms': string;
  'article.back': string;
  'article.copied': string;
  'privacy.title': string;
  'privacy.lastUpdated': string;
  'terms.title': string;
  'terms.lastUpdated': string;
  'authorize.title': string;
  'authorize.subtitle': string;
  'back': string;
  'chat.placeholder': string;
  'chat.send': string;
  'chat.connecting': string;
  'chat.connected': string;
  'chat.empty': string;
  'chat.loginButton': string;
  'chat.loginHint': string;
}

export interface LocalizedArticle {
  title: string;
  subtitle: string;
  content: string;
}

export interface ArticleMeta {
  id: string;
  icon: string;
  category: 'getting-started' | 'features' | 'guides';
}

export interface FullArticle extends ArticleMeta, LocalizedArticle {}
