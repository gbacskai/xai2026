import { Injectable, inject, signal } from '@angular/core';
import { TelegramService } from './telegram.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { StorageService } from './storage.service';
import { PlatformService } from './platform.service';
import { environment } from '../../environments/environment';

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface FileAttachment {
  name: string;
  data: string;  // base64
  mime: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: number;
  buttons?: InlineButton[][];   // rows of buttons
  file?: FileAttachment;
  status?: 'sending' | 'sent' | 'failed';
  _originalText?: string;
  _originalButtons?: InlineButton[][];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private tg = inject(TelegramService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private storageService = inject(StorageService);
  private platformSvc = inject(PlatformService);

  private ws: WebSocket | null = null;
  private _pendingCallbackSource: { messageId: string; originalText: string; originalButtons: InlineButton[][] } | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionToken: string | null = null;

  readonly messages = signal<ChatMessage[]>([]);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected');
  readonly isOpen = signal(false);
  readonly botTyping = signal(false);
  readonly reconnectAttempt = signal(0);
  private pendingQueue: string[] = [];
  readonly linkCode = signal<{ code: string; botUrl: string } | null>(null);
  readonly linkedProviders = signal<{ provider: string; email?: string; displayName?: string }[]>([]);
  readonly sessions = signal<{ chatId: string; sessionToken: string; provider: string }[]>([]);
  readonly currentChatId = signal<string>('');
  readonly pendingInput = signal<string | null>(null);
  readonly currentTier = signal<string>('trial');

  private static readonly MAX_MESSAGES = 500;

  onAgentMessage: ((msg: any) => void) | null = null;

  private addMessage(msg: ChatMessage): void {
    this.messages.update(msgs => {
      const updated = [...msgs, msg];
      return updated.length > ChatService.MAX_MESSAGES ? updated.slice(updated.length - ChatService.MAX_MESSAGES) : updated;
    });
  }

  constructor() {
    if (this.platformSvc.isNative) {
      this.storageService.get('chat_sessions').then(stored => {
        if (stored) {
          try { this.sessions.set(JSON.parse(stored)); } catch { /* ignore */ }
        }
      });
    } else {
      const stored = localStorage.getItem('chat_sessions');
      if (stored) {
        try { this.sessions.set(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }

  connect(): void {
    if (this.tg.isTelegram) return;

    // On reconnect, use sessionToken if available
    const authMsg = this.sessionToken
      ? { type: 'auth', sessionToken: this.sessionToken }
      : null;

    if (!authMsg) {
      const payload = this.auth.getAuthPayload();
      if (!payload) return;
      this.setupWs(
        payload && 'type' in payload && (payload as any).type === 'auth'
          ? payload
          : { type: 'auth', ...payload },
      );
    } else {
      this.setupWs(authMsg);
    }
  }

  private setupWs(authMsg: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.connectionState.set('connecting');
    this.reconnectAttempts = 0;

    let authenticated = false;

    try {
      this.ws = new WebSocket(environment.wsUrl);
    } catch {
      this.connectionState.set('error');
      return;
    }

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify(authMsg));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle auth response
        if (msg.type === 'auth_ok') {
          authenticated = true;
          this.connectionState.set('connected');
          this.reconnectAttempts = 0;
          this.reconnectAttempt.set(0);
          // Replay any pending messages queued while disconnected
          if (this.pendingQueue.length > 0) {
            const queue = [...this.pendingQueue];
            this.pendingQueue = [];
            for (const text of queue) {
              this.ws!.send(JSON.stringify({ type: 'message', text }));
            }
            this.messages.update(msgs => msgs.map(m =>
              m.sender === 'user' && m.status === 'sending' ? { ...m, status: 'sent' as const } : m
            ));
          }
          if (msg.tier) this.currentTier.set(msg.tier);
          if (msg.chatId && msg.sessionToken) {
            this.sessionToken = msg.sessionToken;
            this.currentChatId.set(msg.chatId);
            this.sessions.update(list => {
              const filtered = list.filter(s => s.chatId !== msg.chatId);
              return [...filtered, { chatId: msg.chatId, sessionToken: msg.sessionToken, provider: msg.provider || '' }];
            });
            // Add related accounts from server-side enumeration
            if (msg.relatedAccounts?.length) {
              this.sessions.update(list => {
                let updated = [...list];
                for (const acct of msg.relatedAccounts) {
                  updated = updated.filter(s => s.chatId !== acct.chatId);
                  updated.push({ chatId: acct.chatId, sessionToken: acct.sessionToken, provider: '' });
                }
                return updated;
              });
            }
            this.storageService.set('chat_sessions', JSON.stringify(this.sessions()));
          }
          return;
        }

        if (msg.type === 'auth_error') {
          this.connectionState.set('error');
          this.addMessage({
            id: crypto.randomUUID(),
            text: msg.error || 'Authentication failed',
            sender: 'system',
            timestamp: Date.now(),
          });
          return;
        }

        // Handle token refresh (issued on session token reconnect)
        if (msg.type === 'token_refresh') {
          this.sessionToken = msg.sessionToken;
          this.sessions.update(list =>
            list.map(s => s.chatId === this.currentChatId() ? { ...s, sessionToken: msg.sessionToken } : s)
          );
          this.storageService.set('chat_sessions', JSON.stringify(this.sessions()));
          return;
        }

        // Handle expired session — remove stale session and close
        if (msg.type === 'auth_required' && msg.reason === 'session_expired') {
          this.sessions.update(list => list.filter(s => s.sessionToken !== this.sessionToken));
          this.storageService.set('chat_sessions', JSON.stringify(this.sessions()));
          this.sessionToken = null;
          this.connectionState.set('error');
          this.addMessage({
            id: crypto.randomUUID(),
            text: 'Session expired. Please log in again.',
            sender: 'system',
            timestamp: Date.now(),
          });
          return;
        }

        // Handle status messages (auto-wake progress)
        if (msg.type === 'status') {
          this.connectionState.set('connecting');
          this.addMessage({
            id: crypto.randomUUID(),
            text: msg.message || 'Starting...',
            sender: 'system',
            timestamp: Date.now(),
          });
          return;
        }

        // Handle link code response
        if (msg.type === 'link_code') {
          this.linkCode.set({ code: msg.code, botUrl: msg.botUrl });
          return;
        }

        // Handle link success
        if (msg.type === 'link_success') {
          this.addMessage({
            id: crypto.randomUUID(),
            text: 'Account linked!',
            sender: 'system',
            timestamp: Date.now(),
          });
          // Refresh linked providers
          this.requestAuthLinks();
          return;
        }

        // Handle account_found (linking discovered another account)
        if (msg.type === 'account_found') {
          this.sessions.update(list => {
            const filtered = list.filter(s => s.chatId !== msg.chatId);
            return [...filtered, { chatId: msg.chatId, sessionToken: msg.sessionToken, provider: '' }];
          });
          this.storageService.set('chat_sessions', JSON.stringify(this.sessions()));
          this.addMessage({
            id: crypto.randomUUID(),
            text: 'Another account found — use the account switcher to access it.',
            sender: 'system',
            timestamp: Date.now(),
          });
          return;
        }

        // Route agent messages to AgentsService
        if (msg.type?.startsWith('agents_') && msg.type.endsWith('_result')) {
          this.onAgentMessage?.(msg);
          return;
        }

        // Handle auth links list
        if (msg.type === 'auth_links') {
          this.linkedProviders.set(msg.links || []);
          return;
        }

        // Handle chat messages
        if (msg.type === 'message' || msg.type === 'chat') {
          this.botTyping.set(false);
          // Mark pending user messages as sent
          this.messages.update(msgs => msgs.map(m =>
            m.sender === 'user' && m.status === 'sending' ? { ...m, status: 'sent' as const } : m
          ));
          const incoming: ChatMessage = {
            id: msg.id ?? crypto.randomUUID(),
            text: msg.text ?? msg.payload?.text ?? '',
            sender: msg.sender ?? 'bot',
            timestamp: msg.timestamp ?? Date.now(),
            buttons: msg.buttons,
            file: msg.file,
          };

          // If there's a pending callback and the response has buttons, update in-place
          if (this._pendingCallbackSource && incoming.buttons?.length) {
            const source = this._pendingCallbackSource;
            this._pendingCallbackSource = null;
            this.messages.update(msgs => msgs.map(m => {
              if (m.id === source.messageId) {
                return {
                  ...m,
                  text: incoming.text,
                  buttons: [...incoming.buttons!, [{ text: '\u2039 Back', callback_data: '__back__' }]],
                  _originalText: m._originalText ?? source.originalText,
                  _originalButtons: m._originalButtons ?? source.originalButtons,
                };
              }
              return m;
            }));
          } else {
            this._pendingCallbackSource = null;
            this.addMessage(incoming);
          }
        }
      } catch { /* ignore malformed messages */ }
    };

    this.ws.onclose = () => {
      this.connectionState.set('disconnected');
      // Only reconnect if we had a successful auth before
      if (authenticated) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.connectionState.set('error');
    };
  }

  sendCallback(data: string, sourceMessageId?: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.toast.show('Not connected', 'error');
      return;
    }
    if (sourceMessageId) {
      const msg = this.messages().find(m => m.id === sourceMessageId);
      if (msg) {
        this._pendingCallbackSource = {
          messageId: sourceMessageId,
          originalText: msg.text,
          originalButtons: msg.buttons || [],
        };
      }
    }
    this.ws.send(JSON.stringify({ type: 'callback', data }));
  }

  restoreMessage(messageId: string): void {
    this.messages.update(msgs => msgs.map(m => {
      if (m.id === messageId && m._originalButtons) {
        return {
          ...m,
          text: m._originalText!,
          buttons: m._originalButtons,
          _originalText: undefined,
          _originalButtons: undefined,
        };
      }
      return m;
    }));
  }

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const isConnected = this.ws && this.ws.readyState === WebSocket.OPEN && this.connectionState() === 'connected';

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmed,
      sender: 'user',
      timestamp: Date.now(),
      status: isConnected ? 'sent' : 'sending',
    };
    this.addMessage(msg);

    // Intercept /whoami locally
    if (trimmed === '/whoami') {
      this.handleWhoami();
      return;
    }

    // Intercept /restart — call router API directly (not via openclaw)
    if (trimmed === '/restart') {
      this.handleRestart();
      return;
    }

    // Intercept /stop — call router API to terminate the instance
    if (trimmed === '/stop') {
      this.handleStop();
      return;
    }

    if (isConnected) {
      this.ws!.send(JSON.stringify({ type: 'message', text: trimmed }));
      this.botTyping.set(true);
    } else {
      this.pendingQueue.push(trimmed);
    }
  }

  private handleWhoami(): void {
    const provider = this.auth.currentProvider();
    const tgUser = this.auth.webUser();
    const googleUser = this.auth.googleUser();
    const githubUser = this.auth.githubUser();
    const linkedinUser = this.auth.linkedinUser();
    const chatId = this.currentChatId();
    const linked = this.linkedProviders();

    const lines: string[] = ['\ud83e\udded Identity'];

    if (provider === 'telegram' && tgUser) {
      lines.push(`Provider: Telegram`);
      lines.push(`Name: ${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`);
      if (tgUser.username) lines.push(`Username: @${tgUser.username}`);
      lines.push(`User ID: ${tgUser.id}`);
    } else if (provider === 'google' && googleUser) {
      lines.push(`Provider: Google`);
      if (googleUser.name) lines.push(`Name: ${googleUser.name}`);
      if (googleUser.email) lines.push(`Email: ${googleUser.email}`);
    } else if (provider === 'linkedin' && linkedinUser) {
      lines.push(`Provider: LinkedIn`);
    } else if (provider === 'github' && githubUser) {
      lines.push(`Provider: GitHub`);
    } else if (this.tg.isTelegram) {
      const u = this.tg.user();
      lines.push(`Channel: xAI Workspace`);
      if (u) {
        lines.push(`Name: ${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`);
        if (u.username) lines.push(`Username: @${u.username}`);
        lines.push(`User ID: ${u.id}`);
      }
    } else {
      lines.push(`Provider: Unknown`);
    }

    if (chatId) lines.push(`Chat ID: ${chatId}`);

    if (linked.length > 0) {
      lines.push('');
      lines.push('\ud83d\udd17 Linked accounts');
      for (const l of linked) {
        const parts = [l.provider];
        if (l.displayName) parts.push(l.displayName);
        if (l.email) parts.push(l.email);
        lines.push(`  \u2022 ${parts.join(' \u2014 ')}`);
      }
    }

    this.addMessage({
      id: crypto.randomUUID(),
      text: lines.join('\n'),
      sender: 'bot',
      timestamp: Date.now(),
    });
  }

  private async handleRestart(): Promise<void> {
    const token = this.sessionToken;
    if (!token) {
      this.addMessage({
        id: crypto.randomUUID(),
        text: 'Not authenticated. Please log in first.',
        sender: 'system',
        timestamp: Date.now(),
      });
      return;
    }

    this.addMessage({
      id: crypto.randomUUID(),
      text: 'Restarting instance...',
      sender: 'system',
      timestamp: Date.now(),
    });

    try {
      const res = await fetch(`${environment.routerUrl}/api/restart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }

      this.addMessage({
        id: crypto.randomUUID(),
        text: 'Instance restart initiated. It may take a minute to come back online.',
        sender: 'bot',
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this.addMessage({
        id: crypto.randomUUID(),
        text: `Restart failed: ${err.message || 'Unknown error'}`,
        sender: 'system',
        timestamp: Date.now(),
      });
    }
  }

  private async handleStop(): Promise<void> {
    const token = this.sessionToken;
    if (!token) {
      this.addMessage({
        id: crypto.randomUUID(),
        text: 'Not authenticated. Please log in first.',
        sender: 'system',
        timestamp: Date.now(),
      });
      return;
    }

    this.addMessage({
      id: crypto.randomUUID(),
      text: 'Stopping instance...',
      sender: 'system',
      timestamp: Date.now(),
    });

    try {
      const res = await fetch(`${environment.routerUrl}/api/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }

      this.addMessage({
        id: crypto.randomUUID(),
        text: 'Instance terminated. Send /start to wake it up again.',
        sender: 'bot',
        timestamp: Date.now(),
      });
    } catch (err: any) {
      this.addMessage({
        id: crypto.randomUUID(),
        text: `Stop failed: ${err.message || 'Unknown error'}`,
        sender: 'system',
        timestamp: Date.now(),
      });
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.ws?.close();
    this.ws = null;
    this.connectionState.set('disconnected');
  }

  switchAccount(targetChatId: string): void {
    const session = this.sessions().find(s => s.chatId === targetChatId);
    if (!session) return;
    this.disconnect();
    this.messages.set([]);
    this.sessionToken = session.sessionToken;
    this.setupWs({ type: 'auth', sessionToken: session.sessionToken });
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  reconnect(): void {
    this.reconnectAttempts = 0;
    this.reconnectAttempt.set(0);
    this.connect();
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  sendLinkRequest(target: 'telegram'): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'link', target }));
    }
  }

  sendLinkProvider(provider: string, data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'link_provider', provider, ...data }));
    }
  }

  requestAuthLinks(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get_auth_links' }));
    }
  }

  sendRaw(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState.set('error');
      this.addMessage({
        id: crypto.randomUUID(),
        text: 'Unable to connect. Please refresh.',
        sender: 'system',
        timestamp: Date.now(),
      });
      return;
    }

    this.connectionState.set('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;
    this.reconnectAttempt.set(this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
