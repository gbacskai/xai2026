import { Injectable, inject, signal } from '@angular/core';
import { ChatService } from './chat.service';

export interface AgentEntry {
  name: string;
  filename: string;
}

export interface AgentDetail {
  name: string;
  filename: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private chat = inject(ChatService);

  readonly agents = signal<AgentEntry[]>([]);
  readonly selectedAgent = signal<AgentDetail | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly operationError = signal<string | null>(null);
  readonly isOpen = signal(true);

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

  saveAgent(filename: string, content: string): void {
    this.isSaving.set(true);
    this.operationError.set(null);
    this.chat.sendRaw({ type: 'agents_save', name: filename, content });
  }

  deleteAgent(filename: string): void {
    this.isDeleting.set(true);
    this.operationError.set(null);
    this.chat.sendRaw({ type: 'agents_delete', name: filename });
  }

  createAgent(name: string, content: string): void {
    this.isSaving.set(true);
    this.operationError.set(null);
    this.chat.sendRaw({ type: 'agents_create', name, content });
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
        this.selectedAgent.set({
          name: msg.name,
          filename: msg.filename || msg.name,
          content: msg.content || '',
        });
        this.isLoading.set(false);
        break;
      case 'agents_save_result':
        this.isSaving.set(false);
        if (msg.error) {
          this.operationError.set(msg.error);
        } else {
          // Update selected agent with new content
          const current = this.selectedAgent();
          if (current) {
            this.selectedAgent.set({ ...current, content: msg.content || current.content });
          }
          this.refreshList();
        }
        break;
      case 'agents_delete_result':
        this.isDeleting.set(false);
        if (msg.error) {
          this.operationError.set(msg.error);
        } else {
          this.selectedAgent.set(null);
          this.refreshList();
        }
        break;
      case 'agents_create_result':
        this.isSaving.set(false);
        if (msg.error) {
          this.operationError.set(msg.error);
        } else {
          this.refreshList();
          // Select the newly created agent
          if (msg.filename) {
            this.getAgent(msg.filename);
          }
        }
        break;
    }
  }
}
