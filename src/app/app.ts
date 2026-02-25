import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './services/telegram.service';
import { I18nService } from './i18n/i18n.service';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { ChatPanelComponent } from './components/chat-panel/chat-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatPanelComponent],
  template: `
    <div class="content-frame">
      <router-outlet />
    </div>
    @if (showChat()) {
      <app-chat-panel
        class="chat-frame"
        [class.chat-frame--open]="chat.isOpen()" />
    }
    @if (showChat()) {
      <button class="chat-fab" (click)="chat.toggle()" aria-label="Toggle chat">
        @if (chat.isOpen()) {
          <span>&times;</span>
        } @else {
          <span>💬</span>
        }
      </button>
      @if (chat.isOpen()) {
        <div class="chat-backdrop" (click)="chat.toggle()"></div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 430px;
      margin: 0 auto;
      min-height: 100vh;
    }

    :host(.has-chat) {
      @media (min-width: 861px) {
        max-width: 860px;
        display: flex;
      }
    }

    .content-frame {
      flex: 0 0 430px;
      max-width: 430px;
      min-height: 100vh;
      width: 100%;
    }

    .chat-frame {
      flex: 1;
      min-width: 0;
      position: sticky;
      top: 0;
      height: 100vh;

      @media (max-width: 860px) {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        top: auto;
        height: 65vh;
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 100;

        &--open {
          transform: translateY(0);
        }
      }
    }

    .chat-fab {
      display: none;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: var(--tg-theme-button-color);
      color: var(--tg-theme-button-text-color);
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 101;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: transparent;

      @media (max-width: 860px) {
        display: flex;
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .chat-backdrop {
      display: none;

      @media (max-width: 860px) {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99;
      }
    }
  `,
  host: {
    '[class.has-chat]': 'showChat()',
  },
})
export class App implements OnInit {
  private tg = inject(TelegramService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  chat = inject(ChatService);

  showChat = computed(() => !this.tg.isTelegram && this.auth.isAuthenticated());

  ngOnInit() {
    this.tg.init();
    this.i18n.detect();
  }
}
