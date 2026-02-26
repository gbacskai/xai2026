import { Injectable, inject, signal } from '@angular/core';
import { TelegramService } from './telegram.service';
import { AuthService } from './auth.service';
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
  _originalText?: string;
  _originalButtons?: InlineButton[][];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private tg = inject(TelegramService);
  private auth = inject(AuthService);

  private ws: WebSocket | null = null;
  private _pendingCallbackSource: { messageId: string; originalText: string; originalButtons: InlineButton[][] } | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionToken: string | null = null;

  readonly messages = signal<ChatMessage[]>([]);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  readonly isOpen = signal(false);
  readonly linkCode = signal<{ code: string; botUrl: string } | null>(null);
  readonly linkedProviders = signal<{ provider: string; email?: string; displayName?: string }[]>([]);
  readonly sessions = signal<{ chatId: string; sessionToken: string; provider: string }[]>([]);
  readonly currentChatId = signal<string>('');
  readonly pendingInput = signal<string | null>(null);

  onAgentMessage: ((msg: any) => void) | null = null;

  constructor() {
    const stored = sessionStorage.getItem('chat_sessions');
    if (stored) {
      try { this.sessions.set(JSON.parse(stored)); } catch { /* ignore */ }
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
          if (msg.chatId && msg.sessionToken) {
            this.sessionToken = msg.sessionToken;
            this.currentChatId.set(msg.chatId);
            this.sessions.update(list => {
              const filtered = list.filter(s => s.chatId !== msg.chatId);
              return [...filtered, { chatId: msg.chatId, sessionToken: msg.sessionToken, provider: msg.provider || '' }];
            });
            sessionStorage.setItem('chat_sessions', JSON.stringify(this.sessions()));
          }
          return;
        }

        if (msg.type === 'auth_error') {
          this.connectionState.set('error');
          this.messages.update(msgs => [...msgs, {
            id: crypto.randomUUID(),
            text: msg.error || 'Authentication failed',
            sender: 'system',
            timestamp: Date.now(),
          }]);
          return;
        }

        // Handle status messages (auto-wake progress)
        if (msg.type === 'status') {
          this.connectionState.set('connecting');
          this.messages.update(msgs => [...msgs, {
            id: crypto.randomUUID(),
            text: msg.message || 'Starting...',
            sender: 'system',
            timestamp: Date.now(),
          }]);
          return;
        }

        // Handle link code response
        if (msg.type === 'link_code') {
          this.linkCode.set({ code: msg.code, botUrl: msg.botUrl });
          return;
        }

        // Handle link success
        if (msg.type === 'link_success') {
          this.messages.update(msgs => [...msgs, {
            id: crypto.randomUUID(),
            text: 'Account linked!',
            sender: 'system',
            timestamp: Date.now(),
          }]);
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
          sessionStorage.setItem('chat_sessions', JSON.stringify(this.sessions()));
          this.messages.update(msgs => [...msgs, {
            id: crypto.randomUUID(),
            text: 'Another account found — use the account switcher to access it.',
            sender: 'system',
            timestamp: Date.now(),
          }]);
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
            this.messages.update(msgs => [...msgs, incoming]);
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
    if (this.ws?.readyState === WebSocket.OPEN) {
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

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmed,
      sender: 'user',
      timestamp: Date.now(),
    };
    this.messages.update(msgs => [...msgs, msg]);

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connectionState() === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: trimmed }));
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
