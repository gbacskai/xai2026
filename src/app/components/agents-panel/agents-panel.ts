import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { AgentsService, AgentDetail } from '../../services/agents.service';
import { ChatService } from '../../services/chat.service';
import { I18nService } from '../../i18n/i18n.service';

const AGENT_TEMPLATE = `# Agent Name
**Model**: claude-sonnet-4-6
**Purpose**: Describe what this agent does
**Trigger**: When to spawn this sub-agent
**Behavior**: Detailed instructions for the agent
`;

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

  // Edit state
  isEditing = signal(false);
  editContent = '';

  // Create state
  isCreating = signal(false);
  newAgentName = '';
  newAgentContent = AGENT_TEMPLATE;

  // Delete state
  showDeleteConfirm = signal(false);

  renderedContent = computed(() => {
    const agent = this.agents.selectedAgent();
    if (!agent?.content) return '';
    return marked.parse(agent.content.trim()) as string;
  });

  ngOnInit() {
    if (this.chat.connectionState() === 'connected') {
      this.agents.refreshList();
    }
    const checkConnection = setInterval(() => {
      if (this.chat.connectionState() === 'connected' && this.agents.agents().length === 0 && !this.agents.isLoading()) {
        this.agents.refreshList();
        clearInterval(checkConnection);
      }
    }, 1000);
    setTimeout(() => clearInterval(checkConnection), 30000);
  }

  selectAgent(filename: string): void {
    this.resetState();
    this.agents.getAgent(filename);
  }

  goBack(): void {
    this.resetState();
    this.agents.clearSelection();
  }

  // --- Edit ---
  startEdit(): void {
    const agent = this.agents.selectedAgent();
    if (agent) {
      this.editContent = agent.content;
      this.isEditing.set(true);
      this.showDeleteConfirm.set(false);
    }
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editContent = '';
  }

  saveEdit(): void {
    const agent = this.agents.selectedAgent();
    if (agent) {
      this.agents.saveAgent(agent.filename, this.editContent);
      this.isEditing.set(false);
    }
  }

  // --- Create ---
  startCreate(): void {
    this.isCreating.set(true);
    this.newAgentName = '';
    this.newAgentContent = AGENT_TEMPLATE;
  }

  cancelCreate(): void {
    this.isCreating.set(false);
    this.newAgentName = '';
    this.newAgentContent = AGENT_TEMPLATE;
  }

  submitCreate(): void {
    const name = this.newAgentName.trim();
    if (!name) return;
    this.agents.createAgent(name, this.newAgentContent);
    this.isCreating.set(false);
  }

  // --- Delete ---
  requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    const agent = this.agents.selectedAgent();
    if (agent) {
      this.agents.deleteAgent(agent.filename);
      this.showDeleteConfirm.set(false);
    }
  }

  // --- Run ---
  runAgent(agent: AgentDetail): void {
    const modelMatch = agent.content.match(/\*\*Model\*\*:\s*(\S+)/);
    const model = modelMatch?.[1] || 'claude-sonnet-4-6';
    const cmd = `/subagents spawn main "Read and execute Agents/${agent.filename}" --model ${model}`;
    this.chat.isOpen.set(true);
    this.chat.pendingInput.set(cmd);
  }

  private resetState(): void {
    this.isEditing.set(false);
    this.isCreating.set(false);
    this.showDeleteConfirm.set(false);
    this.editContent = '';
    this.agents.operationError.set(null);
  }
}
