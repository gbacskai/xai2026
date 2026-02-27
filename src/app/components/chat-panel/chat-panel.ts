import { Component, inject, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, HostListener, signal, computed, effect, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { ChatService, ChatMessage, FileAttachment } from '../../services/chat.service';
import { TelegramService } from '../../services/telegram.service';
import { I18nService } from '../../i18n/i18n.service';
import { environment } from '../../../environments/environment';

const COMMANDS: { command: string; description: string }[] = [
  { command: '/usage',      description: 'View your token usage and limits' },
  { command: '/billing',    description: 'Manage subscription and payments' },
  { command: '/models',     description: 'Show and switch AI models' },
  { command: '/invoices',   description: 'View payment history' },
  { command: '/region',     description: 'Switch server region' },
  { command: '/language',   description: 'Change language' },
  { command: '/cancel',     description: 'Cancel subscription' },
  { command: '/privacy',    description: 'Privacy policy and data management' },
  { command: '/authorize',  description: 'Connect third-party services' },
  { command: '/ssh',        description: 'Download SSH key' },
  { command: '/restart',     description: 'Restart your instance' },
  { command: '/status_x',   description: 'Check instance status' },
  { command: '/diagnostic', description: 'Run full stack health check' },
  { command: '/invite',     description: 'Invite someone and earn free tokens' },
  { command: '/invites',    description: 'List your sent invitations' },
  { command: '/workspace',  description: 'View workspace file info' },
  { command: '/whoami',     description: 'Show your identity and linked accounts' },
  { command: '/help',       description: 'Show all available commands' },
];

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(ChatService);
  i18n = inject(I18nService);
  private tg = inject(TelegramService);

  messageText = '';

  commandMenuOpen = signal(false);
  commandMatches = signal<{ command: string; description: string }[]>([]);
  commandSelectedIndex = signal(0);

  @ViewChild('messageList') messageList!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInputRef?: ElementRef<HTMLTextAreaElement>;

  private prevMessageCount = 0;
  private userHasScrolledUp = false;

  // Usage monitor
  usageDaily = signal(0);
  usageWeekly = signal(0);
  usageMonthly = signal(0);
  usageLoaded = signal(false);
  private usageInterval: ReturnType<typeof setInterval> | null = null;

  accountMenuOpen = signal(false);
  currentAccountLabel = computed(() => {
    const id = this.chat.currentChatId();
    return id ? (id.startsWith('w_') ? id.substring(0, 10) : id) : 'Account';
  });

  toggleAccountMenu(): void {
    this.accountMenuOpen.update(v => !v);
  }

  selectAccount(chatId: string): void {
    this.accountMenuOpen.set(false);
    this.chat.switchAccount(chatId);
  }

  private autoFocusEffect = effect(() => {
    if (this.chat.isOpen() && window.innerWidth > 860) {
      setTimeout(() => this.chatInputRef?.nativeElement?.focus(), 100);
    }
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.accountMenuOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.account-switcher')) {
      this.accountMenuOpen.set(false);
    }
  }

  private pendingInputEffect = effect(() => {
    const text = this.chat.pendingInput();
    if (text !== null) {
      this.messageText = text;
      this.chat.pendingInput.set(null);
      // Double rAF: first lets Angular flush the ngModel binding,
      // second measures the updated scrollHeight for auto-resize.
      requestAnimationFrame(() => requestAnimationFrame(() => this.autoResize()));
    }
  });

  ngOnInit() {
    this.chat.connect();
    // Track scroll position for smart-scroll
    setTimeout(() => {
      const el = this.messageList?.nativeElement;
      if (el) {
        el.addEventListener('scroll', () => {
          this.userHasScrolledUp = (el.scrollHeight - el.scrollTop - el.clientHeight) > 100;
        });
      }
    });
    // Fetch usage after connection establishes, then every 60s
    setTimeout(() => this.fetchUsage(), 2000);
    this.usageInterval = setInterval(() => this.fetchUsage(), 60000);
  }

  ngOnDestroy() {
    this.chat.disconnect();
    if (this.usageInterval) clearInterval(this.usageInterval);
  }

  ngAfterViewChecked() {
    const count = this.chat.messages().length;
    if (count !== this.prevMessageCount) {
      this.prevMessageCount = count;
      if (!this.userHasScrolledUp) {
        this.scrollToBottom();
      }
    }
  }

  send(): void {
    this.commandMenuOpen.set(false);
    const text = this.messageText.trim();
    if (!text) return;
    this.tg.haptic();
    this.chat.send(text);
    this.messageText = '';
    requestAnimationFrame(() => this.autoResize());
  }

  autoResize(): void {
    const el = this.chatInputRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  onInput(): void {
    this.autoResize();
    const text = this.messageText;
    if (text.startsWith('/')) {
      const query = text.slice(1).toLowerCase();
      const matches = COMMANDS.filter(c => c.command.slice(1).startsWith(query));
      this.commandMatches.set(matches);
      this.commandMenuOpen.set(matches.length > 0);
      this.commandSelectedIndex.set(0);
    } else {
      this.commandMenuOpen.set(false);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.commandMenuOpen()) {
      const matches = this.commandMatches();
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          this.commandSelectedIndex.update(i => (i > 0 ? i - 1 : matches.length - 1));
          return;
        case 'ArrowDown':
          event.preventDefault();
          this.commandSelectedIndex.update(i => (i < matches.length - 1 ? i + 1 : 0));
          return;
        case 'Tab':
        case 'Enter':
          event.preventDefault();
          this.selectCommand(matches[this.commandSelectedIndex()]);
          return;
        case 'Escape':
          event.preventDefault();
          this.commandMenuOpen.set(false);
          return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  selectCommand(cmd: { command: string; description: string }): void {
    this.tg.haptic();
    this.messageText = cmd.command + ' ';
    this.commandMenuOpen.set(false);
  }

  copyToInput(text: string): void {
    this.messageText = text;
  }

  onCallback(data: string, msg?: ChatMessage): void {
    this.tg.haptic();
    if (data === '__back__' && msg) {
      this.chat.restoreMessage(msg.id);
      return;
    }
    this.chat.sendCallback(data, msg?.id);
  }

  downloadFile(file: FileAttachment): void {
    const bytes = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: file.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  renderMarkdown(text: string): string {
    return marked.parse(text, { async: false }) as string;
  }

  accountDisplayName(session: { chatId: string; provider: string }): string {
    if (session.provider) return session.provider.charAt(0).toUpperCase() + session.provider.slice(1);
    return session.chatId.startsWith('w_') ? session.chatId.substring(0, 10) : session.chatId;
  }

  private async fetchUsage(): Promise<void> {
    const token = this.chat.getSessionToken();
    if (!token) return;
    try {
      const res = await fetch(`${environment.routerUrl}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const limits = data.limits;
      if (!limits) return;

      // Daily: sum today's spend from hourly data
      const dailySpend = (data.hourly as { spend: number }[])?.reduce((s, h) => s + h.spend, 0) ?? 0;
      // Weekly: sum this week's spend from daily data
      const weeklySpend = (data.daily as { spend: number }[])?.reduce((s, d) => s + d.spend, 0) ?? 0;
      // Monthly: last entry in monthly data (current month)
      const monthlyArr = data.monthly as { spend: number }[];
      const monthlySpend = monthlyArr?.length ? monthlyArr[monthlyArr.length - 1].spend : 0;

      this.usageDaily.set(limits.dailyCap > 0 ? Math.round((dailySpend / limits.dailyCap) * 100) : 0);
      this.usageWeekly.set(limits.weeklyCap > 0 ? Math.round((weeklySpend / limits.weeklyCap) * 100) : 0);
      this.usageMonthly.set(limits.monthlyCap > 0 ? Math.round((monthlySpend / limits.monthlyCap) * 100) : 0);
      this.usageLoaded.set(true);
    } catch {
      // Silently fail — usage monitor is non-critical
    }
  }

  private scrollToBottom(): void {
    const el = this.messageList?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
