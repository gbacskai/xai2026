import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';
import { I18nService } from '../../i18n/i18n.service';
import { BackButtonComponent } from '../../components/back-button/back-button';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [BackButtonComponent, RouterLink],
  templateUrl: './invite.html',
  styleUrl: './invite.scss',
})
export class InvitePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tg = inject(TelegramService);
  i18n = inject(I18nService);

  code = '';
  telegramLink = '';

  private backHandler = () => {
    this.tg.haptic();
    this.router.navigate(['/']);
  };

  ngOnInit() {
    this.code = this.route.snapshot.queryParamMap.get('code') || '';
    this.telegramLink = this.code
      ? `https://t.me/xaiworkspacebot?start=${encodeURIComponent(this.code)}`
      : 'https://t.me/xaiworkspacebot';
    this.tg.showBackButton(this.backHandler);
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
  }
}
