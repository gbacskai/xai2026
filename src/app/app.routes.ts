import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { ArticlePage } from './pages/article/article';
import { PrivacyPage } from './pages/privacy/privacy';
import { TermsPage } from './pages/terms/terms';
import { AuthorizePage } from './pages/authorize/authorize';
import { InvitePage } from './pages/invite/invite';
import { ModelsPage } from './pages/models/models';
import { PurchaseCompletePage } from './pages/purchase-complete/purchase-complete';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'article/:id', component: ArticlePage },
  { path: 'authorize', component: AuthorizePage },
  { path: 'invite', component: InvitePage },
  { path: 'models', component: ModelsPage },
  { path: 'privacy', component: PrivacyPage },
  { path: 'purchase-complete', component: PurchaseCompletePage },
  { path: 'terms', component: TermsPage },
  { path: '**', redirectTo: '' },
];
