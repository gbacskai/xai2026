import { Component, inject, OnInit, OnDestroy, computed, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TelegramService } from './services/telegram.service';
import { I18nService } from './i18n/i18n.service';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { AgentsService } from './services/agents.service';
import { PlatformService } from './services/platform.service';
import { PushNotificationService } from './services/push-notification.service';
import { BiometricService } from './services/biometric.service';
import { DeepLinkService } from './services/deep-link.service';
import { ChatPanelComponent } from './components/chat-panel/chat-panel';
import { AgentsPanelComponent } from './components/agents-panel/agents-panel';
import { ToastComponent } from './components/toast/toast';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatPanelComponent, AgentsPanelComponent, ToastComponent],
  template: `
    <app-toast />
    <div id="main-content" class="content-frame" [class.content-frame--collapsed]="sidebarCollapsed()">
      <router-outlet />
    </div>
    @if (showChat()) {
      <button class="collapse-toggle" [class.collapse-toggle--labeled]="collapseLabel()" (click)="toggleSidebar()" aria-label="Toggle sidebar">
        @if (collapseLabel()) {
          <span class="collapse-toggle-label">{{ collapseLabel() }}</span>
        } @else {
          <span class="collapse-toggle-icon">{{ sidebarCollapsed() ? '›' : '‹' }}</span>
        }
      </button>
      <app-chat-panel
        class="chat-frame"
        [class.chat-frame--open]="chat.isOpen()"
        [class.chat-frame--expanded]="sidebarCollapsed()" />
      <button class="agents-toggle" [class.agents-toggle--flashing]="agentsLabelFlashing()" (click)="agents.toggle()" aria-label="Toggle agents">
        @if (agentsLabel()) {
          <span class="agents-toggle-label">{{ agentsLabel() }}</span>
        } @else {
          <span class="collapse-toggle-icon">{{ agents.isOpen() ? '›' : '‹' }}</span>
        }
      </button>
      <app-agents-panel
        class="agents-frame"
        [class.agents-frame--open]="agents.isOpen()" />
    }
    @if (showChat()) {
      <button class="agents-fab" (click)="agents.toggle()" aria-label="Toggle agents">
        @if (agents.isOpen()) {
          <span>&times;</span>
        } @else {
          <span>A</span>
        }
      </button>
      <button class="chat-fab" (click)="chat.toggle()" aria-label="Toggle chat">
        @if (chat.isOpen()) {
          <span>&times;</span>
        } @else {
          <span>💬</span>
        }
      </button>
      @if (chat.isOpen()) {
        <div class="chat-backdrop" (click)="chat.toggle()" (keydown.enter)="chat.toggle()" (keydown.space)="chat.toggle()" role="button" tabindex="0" aria-label="Close chat"></div>
      }
      @if (agents.isOpen()) {
        <div class="agents-backdrop" (click)="agents.toggle()" (keydown.enter)="agents.toggle()" (keydown.space)="agents.toggle()" role="button" tabindex="0" aria-label="Close agents"></div>
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
        max-width: none;
        overflow: hidden;
      }
    }

    router-outlet + * {
      animation: fadeIn 0.2s ease;
    }

    /* --- Desktop: all panels position:fixed, chat pinned to center --- */

    .content-frame {
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
    }

    :host(.has-chat) .content-frame {
      @media (min-width: 861px) {
        position: fixed;
        top: 0;
        right: calc(50% + 450px);
        width: 430px;
        height: 100vh;
        min-height: auto;
        transition: transform 1.5s ease;
      }
    }

    :host(.has-chat) .content-frame--collapsed {
      @media (min-width: 861px) {
        transform: translateX(100%);
      }
    }

    .collapse-toggle {
      display: none;

      @media (min-width: 861px) {
        display: flex;
        position: fixed;
        top: 0;
        right: calc(50% + 430px);
        width: 20px;
        height: 100vh;
        align-items: center;
        justify-content: center;
        background: var(--tg-theme-secondary-bg-color);
        border: none;
        border-left: 1px solid rgba(128, 128, 128, 0.15);
        border-right: 1px solid rgba(128, 128, 128, 0.15);
        cursor: pointer;
        padding: 0;
        color: var(--tg-theme-hint-color);
        transition: background 0.15s, color 0.15s;
        z-index: 3;

        &:hover {
          background: var(--tg-theme-button-color);
          color: var(--tg-theme-button-text-color);
        }
      }
    }

    .collapse-toggle--labeled {
      width: auto;
      min-width: 20px;
      padding: 4px 2px;
    }

    .collapse-toggle-label {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 12px;
      font-weight: 600;
      color: var(--brand-primary);
      letter-spacing: 1px;
    }

    .collapse-toggle-icon {
      font-size: 16px;
      font-weight: bold;
      line-height: 1;
    }

    .chat-frame {
      @media (min-width: 861px) {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 860px;
        height: 100vh;
        z-index: 2;
      }

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

    .agents-toggle {
      display: none;

      @media (min-width: 861px) {
        display: flex;
        position: fixed;
        top: 0;
        left: calc(50% + 430px);
        width: 20px;
        height: 100vh;
        align-items: center;
        justify-content: center;
        background: var(--tg-theme-secondary-bg-color);
        border: none;
        border-left: 1px solid rgba(128, 128, 128, 0.15);
        border-right: 1px solid rgba(128, 128, 128, 0.15);
        cursor: pointer;
        padding: 0;
        color: var(--tg-theme-hint-color);
        transition: background 0.15s, color 0.15s;
        z-index: 3;

        &:hover {
          background: var(--tg-theme-button-color);
          color: var(--tg-theme-button-text-color);
        }
      }
    }

    .agents-toggle-label {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .agents-toggle--flashing {
      animation: flashGreyBlue 2s ease-in-out infinite;
    }

    @keyframes flashGreyBlue {
      0%, 100% { background: var(--tg-theme-secondary-bg-color); color: var(--tg-theme-hint-color); }
      50% { background: var(--brand-primary); color: #fff; }
    }

    .agents-frame {
      @media (min-width: 861px) {
        position: fixed;
        top: 0;
        left: calc(50% + 450px);
        width: 350px;
        height: 100vh;
        overflow: hidden;
        transform: translateX(-100%);
        transition: transform 1.5s ease;
      }

      &--open {
        @media (min-width: 861px) {
          transform: translateX(0);
        }
      }

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
        overflow: visible;

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
      background: var(--brand-gradient);
      color: var(--tg-theme-button-text-color);
      font-size: 24px;
      box-shadow: 0 4px 16px rgba(91, 164, 217, 0.35);
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

    .agents-fab {
      display: none;
      position: fixed;
      bottom: 84px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--tg-theme-section-bg-color);
      color: var(--brand-dark);
      font-size: 18px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(91, 164, 217, 0.2);
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

    .agents-backdrop {
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
    '[class.sidebar-collapsed]': 'sidebarCollapsed()',
  },
})
export class App implements OnInit, OnDestroy {
  private tg = inject(TelegramService);
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private platform = inject(PlatformService);
  private pushNotification = inject(PushNotificationService);
  private biometric = inject(BiometricService);
  private deepLink = inject(DeepLinkService);
  chat = inject(ChatService);
  agents = inject(AgentsService);

  showChat = computed(() => !this.tg.isTelegram && this.auth.isAuthenticated());
  sidebarCollapsed = signal(false);
  collapseLabel = signal<string>('Help');
  agentsLabel = signal<string>('Agents, Tips');
  agentsLabelFlashing = signal(false);

  private helpTimerId: ReturnType<typeof setTimeout> | null = null;
  private collapseTimerId: ReturnType<typeof setTimeout> | null = null;
  private flashTimerId: ReturnType<typeof setTimeout> | null = null;

  private autoOpenEffect = effect(() => {
    if (this.showChat() && window.innerWidth > 860) {
      this.chat.isOpen.set(true);
      // Agents panel starts collapsed — do NOT auto-open

      // Auto-collapse left panel after 3s
      this.collapseTimerId = setTimeout(() => this.sidebarCollapsed.set(true), 3000);

      // Show "Help" label, switch to arrow after 5 minutes
      this.collapseLabel.set('Help');
      this.helpTimerId = setTimeout(() => this.collapseLabel.set(''), 5 * 60 * 1000);

      // Flash agents divider label for 5s
      this.agentsLabelFlashing.set(true);
      this.flashTimerId = setTimeout(() => {
        this.agentsLabelFlashing.set(false);
        this.agentsLabel.set('');
      }, 5000);
    }
  });

  ngOnInit() {
    this.tg.init();
    this.i18n.detect();

    if (this.platform.isNative) {
      this.initNative();
    }
  }

  private async initNative(): Promise<void> {
    // Status bar
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    if (this.platform.isAndroid) {
      StatusBar.setBackgroundColor({ color: '#2D7AB8' }).catch(() => {});
    }

    // Hide splash screen after init
    SplashScreen.hide().catch(() => {});

    // Deep links
    this.deepLink.initialize();

    // Biometric
    await this.biometric.initialize();

    // Push notifications (delayed to allow auth to settle)
    setTimeout(() => this.pushNotification.initialize(), 3000);

    // Biometric lock on app resume
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.biometric.isEnabled()) {
        this.biometric.verifyIdentity();
      }
    });

    // Keyboard handling for iOS
    if (this.platform.isIOS) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.documentElement.style.setProperty('--keyboard-height', info.keyboardHeight + 'px');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      });
    }
  }

  ngOnDestroy() {
    if (this.helpTimerId) clearTimeout(this.helpTimerId);
    if (this.collapseTimerId) clearTimeout(this.collapseTimerId);
    if (this.flashTimerId) clearTimeout(this.flashTimerId);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
    this.collapseLabel.set('');
    if (this.helpTimerId) {
      clearTimeout(this.helpTimerId);
      this.helpTimerId = null;
    }
  }
}
