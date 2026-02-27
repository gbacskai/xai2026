import { Page } from '@playwright/test';

/**
 * Mock WebSocket that fires onclose after 100ms.
 * Useful for tests that only need auth state but not a live connection.
 */
export async function mockWebSocket(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__OriginalWebSocket = window.WebSocket;
    (window as any).WebSocket = class MockWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;

      readyState = 0;
      url: string;
      onopen: ((ev: Event) => void) | null = null;
      onclose: ((ev: CloseEvent) => void) | null = null;
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.readyState = 3;
          this.onclose?.({ code: 1000, reason: 'mock', wasClean: true } as CloseEvent);
        }, 100);
      }

      send() {}
      close() {
        this.readyState = 3;
      }

      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() { return false; }
    };
  });
}

/**
 * Mock WebSocket that fires onopen + auth_ok, enabling full connected state.
 * Echoes user messages back as bot messages for chat testing.
 */
export async function mockWebSocketConnected(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__OriginalWebSocket = window.WebSocket;
    (window as any).WebSocket = class MockConnectedWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;

      readyState = 0;
      url: string;
      onopen: ((ev: Event) => void) | null = null;
      onclose: ((ev: CloseEvent) => void) | null = null;
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;

      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.readyState = 1;
          this.onopen?.({} as Event);
        }, 50);
      }

      send(data: string) {
        try {
          const msg = JSON.parse(data);
          // Respond to auth with auth_ok
          if (msg.type === 'auth') {
            setTimeout(() => {
              this.onmessage?.({
                data: JSON.stringify({
                  type: 'auth_ok',
                  chatId: 'mock-chat-123',
                  sessionToken: 'mock-session-token',
                  tier: 'pro',
                }),
              } as MessageEvent);
            }, 30);
            return;
          }
          // Echo chat messages back as bot responses
          if (msg.text) {
            setTimeout(() => {
              this.onmessage?.({
                data: JSON.stringify({
                  type: 'message',
                  text: `Echo: ${msg.text}`,
                }),
              } as MessageEvent);
            }, 100);
          }
        } catch {
          // ignore non-JSON
        }
      }

      close() {
        this.readyState = 3;
        this.onclose?.({ code: 1000, reason: 'closed', wasClean: true } as CloseEvent);
      }

      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() { return false; }
    };
  });
}
