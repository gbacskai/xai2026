import { ArticleMeta, FullArticle } from '../i18n/i18n.types';

export type { FullArticle as Article };

export const ARTICLE_META: ArticleMeta[] = [
  { id: 'welcome',         icon: '👋', category: 'getting-started' },
  { id: 'first-steps',     icon: '🚀', category: 'getting-started' },
  { id: 'models',          icon: '🧠', category: 'features' },
  { id: 'remote-access',   icon: '🔑', category: 'features' },
  { id: 'billing',         icon: '💳', category: 'features' },
  { id: 'productivity',    icon: '⚡', category: 'guides' },
  { id: 'language-region', icon: '🌍', category: 'guides' },
  { id: 'privacy-data',    icon: '🔒', category: 'guides' },
  { id: 'referrals',       icon: '🎁', category: 'guides' },
];
