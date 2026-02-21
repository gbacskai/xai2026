import { Component, inject, OnInit, OnDestroy, signal, ElementRef, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';
import { TelegramService } from '../../services/telegram.service';
import { ARTICLES } from '../../data/articles';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article.html',
  styleUrl: './article.scss',
})
export class ArticlePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tg = inject(TelegramService);

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
    const article = ARTICLES.find(a => a.id === id);

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
        return `<code class="cmd">${token.text}</code>`;
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

    // Check if clicked element is an inline <code> containing a /command
    // (skip <code> inside <pre> — those are code blocks)
    if (target.tagName === 'CODE' && !target.closest('pre')) {
      const text = target.textContent?.trim() ?? '';
      if (text.startsWith('/')) {
        event.preventDefault();
        this.tg.haptic('medium');
        navigator.clipboard.writeText(text).then(() => {
          this.tg.showAlert(`"${text}" copied — paste it in the chat`, () => this.tg.close());
        });
      }
    }
  }
}
