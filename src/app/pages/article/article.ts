import { Component, inject, OnInit, OnDestroy, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { marked } from 'marked';
import { TelegramService } from '../../services/telegram.service';
import { ChatService } from '../../services/chat.service';
import { I18nService } from '../../i18n/i18n.service';
import { BackButtonComponent } from '../../components/back-button/back-button';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './article.html',
  styleUrl: './article.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ArticlePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tg = inject(TelegramService);
  private chat = inject(ChatService);
  i18n = inject(I18nService);

  title = signal('');
  subtitle = signal('');
  icon = signal('');
  html = signal('');

  private backHandler = () => {
    this.tg.haptic();
    this.router.navigate(['/']);
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const article = this.i18n.articles().find(a => a.id === id);

    if (!article) {
      this.router.navigate(['/']);
      return;
    }

    this.title.set(article.title);
    this.subtitle.set(article.subtitle);
    this.icon.set(article.icon);
    const renderer = new marked.Renderer();
    const defaultCodespan = renderer.codespan.bind(renderer);
    renderer.codespan = (token) => {
      if (token.text.startsWith('/')) {
        const esc = token.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<code class="cmd">${esc}</code>`;
      }
      return defaultCodespan(token);
    };
    this.html.set(marked.parse(article.content.trim(), { renderer }) as string);

    this.tg.showBackButton(this.backHandler);
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
  }

  onBodyClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.tagName === 'CODE' && !target.closest('pre')) {
      const text = target.textContent?.trim() ?? '';
      if (text.startsWith('/')) {
        event.preventDefault();
        this.tg.haptic('medium');

        if (this.tg.isTelegram) {
          navigator.clipboard.writeText(text)
            .then(() => {
              this.tg.showAlert(this.i18n.t('article.copied', { cmd: text }));
            })
            .catch(() => {});
        } else {
          this.chat.isOpen.set(true);
          this.chat.send(text);
        }
      }
    }
  }
}
