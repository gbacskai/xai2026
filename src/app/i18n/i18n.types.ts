export type SupportedLocale =
  | 'en' | 'zh' | 'es' | 'ar' | 'pt-BR'
  | 'de' | 'fr' | 'ja' | 'ru' | 'hi';

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  'en', 'zh', 'es', 'ar', 'pt-BR', 'de', 'fr', 'ja', 'ru', 'hi',
];

export interface UiStrings {
  'hero.greeting': string;
  'hero.inviteOnly': string;
  'hero.openTelegram': string;
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
  'chat.loginTelegram': string;
  'chat.loginGoogle': string;
  'chat.loginDivider': string;
  'chat.loginHint': string;
  'chat.linkTelegram': string;
  'chat.loginGithub': string;
  'chat.linkGoogle': string;
  'chat.linkGithub': string;
  'chat.linkSuccess': string;
  'chat.disconnected': string;
  'footer.logout': string;
  'agents.title': string;
  'agents.empty': string;
  'agents.loading': string;
  'agents.back': string;
  'agents.error': string;
  'agents.edit': string;
  'agents.save': string;
  'agents.saving': string;
  'agents.cancel': string;
  'agents.delete': string;
  'agents.deleteConfirm': string;
  'agents.deleteYes': string;
  'agents.deleteNo': string;
  'agents.deleting': string;
  'agents.create': string;
  'agents.createSave': string;
  'agents.namePlaceholder': string;
  'agents.run': string;
  'invite.title': string;
  'invite.subtitle': string;
  'invite.headline': string;
  'invite.description': string;
  'invite.feature1': string;
  'invite.feature2': string;
  'invite.feature3': string;
  'invite.feature4': string;
  'invite.feature5': string;
  'invite.feature6': string;
  'invite.cta': string;
  'invite.ctaGeneric': string;
  'invite.noCode': string;
  'invite.footer': string;
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
