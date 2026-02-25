import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';
import { ARTICLES, Article } from '../../data/articles';

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

  gettingStarted = ARTICLES.filter(a => a.category === 'getting-started');
  features = ARTICLES.filter(a => a.category === 'features');
  guides = ARTICLES.filter(a => a.category === 'guides');

  ngOnInit() {
    this.tg.hideBackButton();
  }

  open(article: Article) {
    this.tg.haptic();
    this.router.navigate(['/article', article.id]);
  }

}
