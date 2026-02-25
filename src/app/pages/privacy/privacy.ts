import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { marked } from 'marked';
import { TelegramService } from '../../services/telegram.service';
import { I18nService } from '../../i18n/i18n.service';
import { BackButtonComponent } from '../../components/back-button/back-button';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class PrivacyPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private tg = inject(TelegramService);
  i18n = inject(I18nService);

  html = '';

  private backHandler = () => {
    this.tg.haptic();
    this.router.navigate(['/']);
  };

  ngOnInit() {
    this.html = marked.parse(this.i18n.getPrivacyContent().trim()) as string;
    this.tg.showBackButton(this.backHandler);
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
  }
}
