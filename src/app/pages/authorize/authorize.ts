import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { marked } from 'marked';
import { TelegramService } from '../../services/telegram.service';
import { I18nService } from '../../i18n/i18n.service';
import { BackButtonComponent } from '../../components/back-button/back-button';

@Component({
  selector: 'app-authorize',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './authorize.html',
  styleUrl: './authorize.scss',
})
export class AuthorizePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private tg = inject(TelegramService);
  i18n = inject(I18nService);

  html = '';

  private backHandler = () => {
    this.tg.haptic();
    this.router.navigate(['/']);
  };

  ngOnInit() {
    const renderer = new marked.Renderer();
    const defaultCodespan = renderer.codespan.bind(renderer);
    renderer.codespan = (token) => {
      if (token.text.startsWith('/')) {
        return `<code class="cmd">${token.text}</code>`;
      }
      return defaultCodespan(token);
    };
    this.html = marked.parse(this.i18n.getAuthorizeContent().trim(), { renderer }) as string;
    this.tg.showBackButton(this.backHandler);
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
  }
}
