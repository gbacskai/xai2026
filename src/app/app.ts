import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './services/telegram.service';
import { I18nService } from './i18n/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: `
    :host {
      display: block;
      max-width: 430px;
      margin: 0 auto;
      min-height: 100vh;
    }
  `,
})
export class App implements OnInit {
  private tg = inject(TelegramService);
  private i18n = inject(I18nService);

  ngOnInit() {
    this.tg.init();
    this.i18n.detect();
  }
}
