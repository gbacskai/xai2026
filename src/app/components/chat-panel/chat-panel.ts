import { Component, inject, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, FileAttachment } from '../../services/chat.service';
import { I18nService } from '../../i18n/i18n.service';

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
  { command: '/status_x',   description: 'Check instance status' },
  { command: '/diagnostic', description: 'Run full stack health check' },
  { command: '/invite',     description: 'Invite someone and earn free tokens' },
  { command: '/invites',    description: 'List your sent invitations' },
  { command: '/workspace',  description: 'View workspace file info' },
  { command: '/help',       description: 'Show all available commands' },
];

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(ChatService);
  i18n = inject(I18nService);

  messageText = '';

  commandMenuOpen = signal(false);
  commandMatches = signal<{ command: string; description: string }[]>([]);
  commandSelectedIndex = signal(0);

  @ViewChild('messageList') messageList!: ElementRef<HTMLDivElement>;

  private prevMessageCount = 0;

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

  private pendingInputEffect = effect(() => {
    const text = this.chat.pendingInput();
    if (text !== null) {
      this.messageText = text;
      this.chat.pendingInput.set(null);
    }
  });

  ngOnInit() {
    this.chat.connect();
  }

  ngOnDestroy() {
    this.chat.disconnect();
  }

  ngAfterViewChecked() {
    const count = this.chat.messages().length;
    if (count !== this.prevMessageCount) {
      this.prevMessageCount = count;
      this.scrollToBottom();
    }
  }

  send(): void {
    this.commandMenuOpen.set(false);
    const text = this.messageText.trim();
    if (!text) return;
    this.chat.send(text);
    this.messageText = '';
  }

  onInput(): void {
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
    this.messageText = cmd.command + ' ';
    this.commandMenuOpen.set(false);
  }

  copyToInput(text: string): void {
    this.messageText = text;
  }

  onCallback(data: string, msg?: ChatMessage): void {
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

  private scrollToBottom(): void {
    const el = this.messageList?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
