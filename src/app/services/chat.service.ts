import { Injectable, inject, signal } from '@angular/core';
import { TelegramService } from './telegram.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private tg = inject(TelegramService);
  private auth = inject(AuthService);

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly messages = signal<ChatMessage[]>([]);
  readonly connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  readonly isOpen = signal(false);

  connect(): void {
    if (this.tg.isTelegram) return;

    const payload = this.auth.getAuthPayload();
    if (!payload) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.connectionState.set('connecting');

    let authenticated = false;

    try {
      this.ws = new WebSocket(environment.wsUrl);
    } catch {
      this.connectionState.set('error');
      return;
    }

    this.ws.onopen = () => {
      // Send auth immediately on connect
      this.ws!.send(JSON.stringify({ type: 'auth', ...payload }));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle auth response
        if (msg.type === 'auth_ok') {
          authenticated = true;
          this.connectionState.set('connected');
          this.reconnectAttempts = 0;
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

        // Handle chat messages
        if (msg.type === 'message' || msg.type === 'chat') {
          this.messages.update(msgs => [...msgs, {
            id: msg.id ?? crypto.randomUUID(),
            text: msg.text ?? msg.payload?.text ?? '',
            sender: msg.sender ?? 'bot',
            timestamp: msg.timestamp ?? Date.now(),
          }]);
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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

  toggle(): void {
    this.isOpen.update(v => !v);
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
