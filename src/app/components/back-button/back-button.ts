import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (!tg.isTelegram) {
      <div class="back-bar">
        <a routerLink="/" class="back-bar-link">
          {{ i18n.t('back') }}
        </a>
      </div>
    }
  `,
  styleUrl: './back-button.scss',
})
export class BackButtonComponent {
  tg = inject(TelegramService);
  i18n = inject(I18nService);
}
