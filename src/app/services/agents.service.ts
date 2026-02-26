import { Injectable, inject, signal } from '@angular/core';
import { ChatService } from './chat.service';

export interface AgentEntry {
  name: string;
  filename: string;
}

export interface AgentDetail {
  name: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private chat = inject(ChatService);

  readonly agents = signal<AgentEntry[]>([]);
  readonly selectedAgent = signal<AgentDetail | null>(null);
  readonly isLoading = signal(false);
  readonly isGenerating = signal(false);
  readonly generateResult = signal<string | null>(null);
  readonly isOpen = signal(false);

  constructor() {
    this.chat.onAgentMessage = (msg: any) => this.handleMessage(msg);
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  refreshList(): void {
    this.isLoading.set(true);
    this.chat.sendRaw({ type: 'agents_list' });
  }

  getAgent(filename: string): void {
    this.isLoading.set(true);
    this.chat.sendRaw({ type: 'agents_get', name: filename });
  }

  generate(instruction?: string): void {
    this.isGenerating.set(true);
    this.generateResult.set(null);
    this.chat.sendRaw({ type: 'agents_generate', instruction });
  }

  clearSelection(): void {
    this.selectedAgent.set(null);
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case 'agents_list_result':
        this.agents.set(msg.agents || []);
        this.isLoading.set(false);
        break;
      case 'agents_get_result':
        this.selectedAgent.set({ name: msg.name, content: msg.content || '' });
        this.isLoading.set(false);
        break;
      case 'agents_generate_result':
        this.generateResult.set(msg.message || 'Done.');
        this.isGenerating.set(false);
        this.refreshList();
        break;
    }
  }
}
