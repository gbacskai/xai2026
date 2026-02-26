import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-purchase-complete',
  standalone: true,
  templateUrl: './purchase-complete.html',
  styleUrl: './purchase-complete.scss',
})
export class PurchaseCompletePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tg = inject(TelegramService);

  sessionId = '';

  private backHandler = () => {
    this.tg.haptic();
    this.router.navigate(['/']);
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || '';
    });
    this.tg.showBackButton(this.backHandler);
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
