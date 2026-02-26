import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { AgentsService } from '../../services/agents.service';
import { ChatService } from '../../services/chat.service';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-agents-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agents-panel.html',
  styleUrl: './agents-panel.scss',
})
export class AgentsPanelComponent implements OnInit {
  agents = inject(AgentsService);
  private chat = inject(ChatService);
  i18n = inject(I18nService);

  instruction = '';

  renderedContent = computed(() => {
    const agent = this.agents.selectedAgent();
    if (!agent?.content) return '';
    return marked.parse(agent.content.trim()) as string;
  });

  ngOnInit() {
    if (this.chat.connectionState() === 'connected') {
      this.agents.refreshList();
    }
    // Also watch for connection changes
    const checkConnection = setInterval(() => {
      if (this.chat.connectionState() === 'connected' && this.agents.agents().length === 0 && !this.agents.isLoading()) {
        this.agents.refreshList();
        clearInterval(checkConnection);
      }
    }, 1000);
    // Clean up after 30s
    setTimeout(() => clearInterval(checkConnection), 30000);
  }

  selectAgent(filename: string): void {
    this.agents.getAgent(filename);
  }

  goBack(): void {
    this.agents.clearSelection();
  }

  onGenerate(): void {
    this.agents.generate(this.instruction.trim() || undefined);
    this.instruction = '';
  }
}
