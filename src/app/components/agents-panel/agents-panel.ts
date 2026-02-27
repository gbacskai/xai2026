import { Component, inject, OnInit, OnDestroy, computed, signal, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { AgentsService, AgentDetail } from '../../services/agents.service';
import { ChatService } from '../../services/chat.service';
import { TelegramService } from '../../services/telegram.service';
import { ToastService } from '../../services/toast.service';
import { I18nService } from '../../i18n/i18n.service';

type PanelTab = 'agents' | 'recommendations';

interface Recommendation {
  icon: string;
  text: string;
  prompt: string;
  action?: () => void;
}

const AGENT_TEMPLATE = `# Agent Name
**Model**: claude-sonnet-4-6
**Priority**: medium
**Purpose**: Describe what this agent does
**Trigger**: When to spawn this sub-agent
**Behavior**:
- Step-by-step instructions for how the agent should operate
- Add more steps as needed
**Run**: \`/subagents spawn main "Read and execute Agents/AgentName.md" --model claude-sonnet-4-6\`
`;

interface AgentTemplate { name: string; label: string; content: string; }

const AGENT_TEMPLATES: AgentTemplate[] = [
  { name: 'generate-agents', label: 'Generate Agents', content: `# Generate Agents\n**Model**: claude-sonnet-4-6\n**Priority**: high\n**Purpose**: Analyze workspace context and create/update agent definitions to improve productivity\n**Trigger**: Run periodically or when the user wants to optimize their workflow\n**Behavior**:\n- Read MEMORY.md and all files in the memory/ directory for persistent context\n- Scan past chat sessions in ~/.openclaw/agents/main/sessions/ to identify recurring tasks, frequent requests, and workflow patterns\n- Read existing agent definitions in Agents/ and AGENTS.md\n- Based on the analysis, create new agents or update existing ones that automate repetitive tasks, handle common requests more efficiently, streamline multi-step workflows, and fill gaps where the user currently does manual work\n- Write each agent as a separate file in Agents/ using the standard template format\n- Update AGENTS.md as an index with a summary of each agent\n- Report what was created, updated, or removed and why\n**Run**: \`/subagents spawn main "Read and execute Agents/GenerateAgents.md" --model claude-sonnet-4-6\`` },
  { name: 'email-triage', label: 'Email Triage', content: `# Email Triage\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Categorize and prioritize incoming emails\n**Trigger**: Run at the start of each workday\n**Behavior**:\n- Scan inbox for new and unread messages\n- Label each by urgency (high/medium/low)\n- Flag items needing immediate response\n- Produce a prioritized summary with recommended actions\n**Run**: \`/subagents spawn main "Read and execute Agents/EmailTriage.md" --model claude-sonnet-4-6\`` },
  { name: 'email-drafter', label: 'Email Drafter', content: `# Email Drafter\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Draft professional email replies\n**Trigger**: When a reply is needed for an incoming email\n**Behavior**:\n- Analyze the incoming email context and sender relationship\n- Draft a clear and professional reply matching the appropriate tone\n- Present the draft for review before sending\n**Run**: \`/subagents spawn main "Read and execute Agents/EmailDrafter.md" --model claude-sonnet-4-6\`` },
  { name: 'email-followup', label: 'Email Follow-up', content: `# Email Follow-up\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Track and remind about unanswered emails\n**Trigger**: Run daily in the afternoon\n**Behavior**:\n- Scan sent emails with no reply after 48 hours\n- Compile a follow-up list sorted by importance\n- Draft gentle follow-up messages for each\n**Run**: \`/subagents spawn main "Read and execute Agents/EmailFollowup.md" --model claude-sonnet-4-6\`` },
  { name: 'email-summary', label: 'Email Summary', content: `# Email Summary\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Summarize long email threads\n**Trigger**: When an email thread exceeds 5 messages\n**Behavior**:\n- Read the full thread from oldest to newest\n- Extract key decisions, action items, and open questions\n- Produce a concise bullet-point summary\n**Run**: \`/subagents spawn main "Read and execute Agents/EmailSummary.md" --model claude-sonnet-4-6\`` },
  { name: 'calendar-scheduler', label: 'Calendar Scheduler', content: `# Calendar Scheduler\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Find optimal meeting times and schedule events\n**Trigger**: When a meeting request is received\n**Behavior**:\n- Check calendar availability for all participants\n- Suggest the best open slots considering time zones and preferences\n- Create the calendar event once confirmed\n**Run**: \`/subagents spawn main "Read and execute Agents/CalendarScheduler.md" --model claude-sonnet-4-6\`` },
  { name: 'meeting-prep', label: 'Meeting Prep', content: `# Meeting Prep\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Prepare briefing materials before meetings\n**Trigger**: 30 minutes before each scheduled meeting\n**Behavior**:\n- Gather relevant documents and past meeting notes\n- Review attendee context and recent interactions\n- Compile a one-page briefing with agenda items and talking points\n**Run**: \`/subagents spawn main "Read and execute Agents/MeetingPrep.md" --model claude-sonnet-4-6\`` },
  { name: 'conflict-resolver', label: 'Conflict Resolver', content: `# Conflict Resolver\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Detect and resolve calendar conflicts\n**Trigger**: When a new event overlaps with an existing one\n**Behavior**:\n- Identify the conflicting events\n- Evaluate priority of each based on attendees and importance\n- Suggest rescheduling options and propose resolution with minimal disruption\n**Run**: \`/subagents spawn main "Read and execute Agents/ConflictResolver.md" --model claude-sonnet-4-6\`` },
  { name: 'todo-manager', label: 'Todo Manager', content: `# Todo Manager\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Organize and prioritize task lists\n**Trigger**: When tasks are added or updated\n**Behavior**:\n- Maintain a prioritized task list grouped by project or context\n- Flag overdue items and approaching deadlines\n- Suggest the next most important task to work on\n**Run**: \`/subagents spawn main "Read and execute Agents/TodoManager.md" --model claude-sonnet-4-6\`` },
  { name: 'daily-planner', label: 'Daily Planner', content: `# Daily Planner\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Create a structured plan for the day\n**Trigger**: Run at the start of each workday\n**Behavior**:\n- Review calendar events, pending tasks, and deadlines\n- Create a time-blocked daily schedule\n- Include buffer time for unexpected work\n**Run**: \`/subagents spawn main "Read and execute Agents/DailyPlanner.md" --model claude-sonnet-4-6\`` },
  { name: 'weekly-review', label: 'Weekly Review', content: `# Weekly Review\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Summarize accomplishments and plan the week ahead\n**Trigger**: Run every Friday afternoon\n**Behavior**:\n- Review completed tasks and track progress on goals\n- Identify blockers and unresolved issues\n- Draft a summary of the week along with priorities for next week\n**Run**: \`/subagents spawn main "Read and execute Agents/WeeklyReview.md" --model claude-sonnet-4-6\`` },
  { name: 'doc-drafter', label: 'Document Drafter', content: `# Document Drafter\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Draft documents from outlines or notes\n**Trigger**: When provided with an outline or rough notes\n**Behavior**:\n- Analyze the outline structure and target audience\n- Expand into a well-structured document with proper formatting and headings\n- Use clear language appropriate for the intended readers\n**Run**: \`/subagents spawn main "Read and execute Agents/DocDrafter.md" --model claude-sonnet-4-6\`` },
  { name: 'meeting-notes', label: 'Meeting Notes', content: `# Meeting Notes\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Capture and organize meeting notes\n**Trigger**: During or after a meeting\n**Behavior**:\n- Record key discussion points and decisions made\n- List action items with owners and deadlines\n- Distribute the formatted notes to all attendees\n**Run**: \`/subagents spawn main "Read and execute Agents/MeetingNotes.md" --model claude-sonnet-4-6\`` },
  { name: 'proofreader', label: 'Proofreader', content: `# Proofreader\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Review documents for grammar, clarity, and tone\n**Trigger**: Before sending or publishing any document\n**Behavior**:\n- Check for spelling, grammar, and punctuation errors\n- Suggest improvements for clarity and conciseness\n- Ensure consistent tone throughout\n**Run**: \`/subagents spawn main "Read and execute Agents/Proofreader.md" --model claude-sonnet-4-6\`` },
  { name: 'slack-summary', label: 'Slack Summary', content: `# Slack Summary\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Summarize unread Slack channels\n**Trigger**: Run at the start of each workday\n**Behavior**:\n- Scan unread messages across channels\n- Extract important announcements, decisions, and mentions\n- Produce a digest organized by channel with action items highlighted\n**Run**: \`/subagents spawn main "Read and execute Agents/SlackSummary.md" --model claude-sonnet-4-6\`` },
  { name: 'standup-writer', label: 'Standup Writer', content: `# Standup Writer\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Generate daily standup updates\n**Trigger**: Run each morning before standup\n**Behavior**:\n- Review yesterday's completed tasks\n- Check today's calendar and planned work\n- Identify any blockers and format a concise standup update in the team's standard format\n**Run**: \`/subagents spawn main "Read and execute Agents/StandupWriter.md" --model claude-sonnet-4-6\`` },
  { name: 'client-followup', label: 'Client Follow-up', content: `# Client Follow-up\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Draft follow-up messages to clients\n**Trigger**: After a client meeting or milestone\n**Behavior**:\n- Summarize what was discussed or delivered\n- Outline next steps and expected timelines\n- Draft a professional follow-up email that maintains the relationship and keeps momentum\n**Run**: \`/subagents spawn main "Read and execute Agents/ClientFollowup.md" --model claude-sonnet-4-6\`` },
  { name: 'invoice-tracker', label: 'Invoice Tracker', content: `# Invoice Tracker\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Track invoices and payment status\n**Trigger**: Run weekly on Mondays\n**Behavior**:\n- Review outstanding invoices and check payment due dates\n- Flag overdue items\n- Produce a summary with recommended follow-up actions for unpaid invoices\n**Run**: \`/subagents spawn main "Read and execute Agents/InvoiceTracker.md" --model claude-sonnet-4-6\`` },
  { name: 'expense-logger', label: 'Expense Logger', content: `# Expense Logger\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Log and categorize expenses\n**Trigger**: When a receipt or expense is submitted\n**Behavior**:\n- Extract amount, date, vendor, and category from the receipt\n- Log it in the expense tracker\n- Flag any items that need approval or exceed budget thresholds\n**Run**: \`/subagents spawn main "Read and execute Agents/ExpenseLogger.md" --model claude-sonnet-4-6\`` },
  { name: 'web-researcher', label: 'Web Researcher', content: `# Web Researcher\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Research topics and compile findings\n**Trigger**: When research is requested on a topic\n**Behavior**:\n- Search for relevant sources and evaluate credibility\n- Extract key information from each source\n- Compile a structured research brief with citations and key takeaways\n**Run**: \`/subagents spawn main "Read and execute Agents/WebResearcher.md" --model claude-sonnet-4-6\`` },
  { name: 'competitor-watch', label: 'Competitor Watch', content: `# Competitor Watch\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Monitor competitor activity and news\n**Trigger**: Run weekly\n**Behavior**:\n- Scan news, social media, and public filings for competitor updates\n- Summarize product launches, pricing changes, and strategic moves\n- Highlight items requiring attention\n**Run**: \`/subagents spawn main "Read and execute Agents/CompetitorWatch.md" --model claude-sonnet-4-6\`` },
  { name: 'code-reviewer', label: 'Code Reviewer', content: `# Code Reviewer\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Review code changes for quality and issues\n**Trigger**: When a pull request or code change is submitted\n**Behavior**:\n- Analyze the diff for bugs and security issues\n- Check for style violations and performance concerns\n- Provide constructive feedback with specific suggestions for improvement\n**Run**: \`/subagents spawn main "Read and execute Agents/CodeReviewer.md" --model claude-sonnet-4-6\`` },
  { name: 'bug-triager', label: 'Bug Triager', content: `# Bug Triager\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Categorize and prioritize bug reports\n**Trigger**: When a new bug report is filed\n**Behavior**:\n- Analyze the bug description and assess severity and impact\n- Assign priority level\n- Suggest which team or developer should investigate and check for duplicate reports\n**Run**: \`/subagents spawn main "Read and execute Agents/BugTriager.md" --model claude-sonnet-4-6\`` },
  { name: 'wellness-check', label: 'Wellness Check', content: `# Wellness Check\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Prompt healthy work habits and breaks\n**Trigger**: Every 2 hours during work time\n**Behavior**:\n- Check how long since the last break\n- Suggest stretching or walking and remind about hydration\n- Offer a brief mindfulness exercise if stress indicators are detected\n**Run**: \`/subagents spawn main "Read and execute Agents/WellnessCheck.md" --model claude-sonnet-4-6\`` },
  { name: 'social-poster', label: 'Social Media Poster', content: `# Social Media Poster\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Draft social media posts\n**Trigger**: When content needs to be shared on social media\n**Behavior**:\n- Adapt the content for each platform's format and audience\n- Suggest relevant hashtags and recommend optimal posting times\n- Present drafts for approval before publishing\n**Run**: \`/subagents spawn main "Read and execute Agents/SocialPoster.md" --model claude-sonnet-4-6\`` },
  { name: 'crm-updater', label: 'CRM Updater', content: `# CRM Updater\n**Model**: claude-sonnet-4-6\n**Priority**: medium\n**Purpose**: Keep CRM records up to date\n**Trigger**: After client interactions or deal updates\n**Behavior**:\n- Extract key details from emails, meetings, and notes\n- Update the relevant CRM fields including contact info, deal stage, and next steps\n- Flag records that need manual review\n**Run**: \`/subagents spawn main "Read and execute Agents/CRMUpdater.md" --model claude-sonnet-4-6\`` },
];

@Component({
  selector: 'app-agents-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agents-panel.html',
  styleUrl: './agents-panel.scss',
})
export class AgentsPanelComponent implements OnInit, OnDestroy {
  agents = inject(AgentsService);
  chat = inject(ChatService);
  private tg = inject(TelegramService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  i18n = inject(I18nService);

  @ViewChild('editTextarea') editTextareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('createTextarea') createTextareaRef?: ElementRef<HTMLTextAreaElement>;

  // Tab state
  activeTab = signal<PanelTab>('agents');

  // Edit state
  isEditing = signal(false);
  editContent = '';

  // Create state
  isCreating = signal(false);
  newAgentName = '';
  newAgentContent = AGENT_TEMPLATE;

  // Templates
  templates = AGENT_TEMPLATES;

  // Delete state
  showDeleteConfirm = signal(false);

  // Confirmation modal
  confirmAction = signal<{ message: string; onConfirm: () => void } | null>(null);

  // Invite state
  inviteEmail = '';
  inviteMessage = '';
  showInvite = computed(() => {
    const tier = this.chat.currentTier();
    return tier !== 'professional' && tier !== 'enterprise' && tier !== 'ultimate';
  });

  // Search/filter
  searchQuery = signal('');
  filteredAgents = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.agents.agents();
    return this.agents.agents().filter(a => a.name.toLowerCase().includes(q));
  });

  // Draft auto-save
  private draftTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
  private connectionCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  // Preview state
  showEditPreview = signal(false);
  showCreatePreview = signal(false);
  editPreviewHtml: SafeHtml = '';
  createPreviewHtml: SafeHtml = '';

  // MD render cache
  private renderedCache = new Map<string, SafeHtml>();
  private static readonly MAX_CACHE = 20;

  renderedContent = computed(() => {
    const agent = this.agents.selectedAgent();
    if (!agent?.content) return '';
    const key = agent.filename + ':' + agent.content.length;
    let cached = this.renderedCache.get(key);
    if (!cached) {
      cached = this.sanitizer.bypassSecurityTrustHtml(marked.parse(agent.content.trim()) as string);
      if (this.renderedCache.size >= AgentsPanelComponent.MAX_CACHE) {
        const firstKey = this.renderedCache.keys().next().value!;
        this.renderedCache.delete(firstKey);
      }
      this.renderedCache.set(key, cached);
    }
    return cached;
  });

  ngOnDestroy() {
    if (this.draftTimer) clearTimeout(this.draftTimer);
    if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
    if (this.connectionCheckTimeout) clearTimeout(this.connectionCheckTimeout);
  }

  scheduleDraftSave(): void {
    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => {
      const agent = this.agents.selectedAgent();
      if (agent && this.isEditing()) {
        localStorage.setItem('agent_draft_' + agent.filename, this.editContent);
      }
    }, 3000);
  }

  ngOnInit() {
    if (this.chat.connectionState() === 'connected') {
      this.agents.refreshList();
    }
    this.connectionCheckInterval = setInterval(() => {
      if (this.chat.connectionState() === 'connected' && this.agents.agents().length === 0 && !this.agents.isLoading()) {
        this.agents.refreshList();
        if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
        this.connectionCheckInterval = null;
      }
    }, 1000);
    this.connectionCheckTimeout = setTimeout(() => {
      if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }, 30000);
  }

  selectAgent(filename: string): void {
    this.tg.haptic();
    this.resetState();
    this.agents.getAgent(filename);
  }

  goBack(): void {
    this.resetState();
    this.agents.clearSelection();
  }

  // --- Preview ---
  toggleEditPreview(): void {
    this.showEditPreview.update(v => !v);
    if (this.showEditPreview()) {
      this.editPreviewHtml = this.sanitizer.bypassSecurityTrustHtml(marked.parse(this.editContent.trim()) as string);
    }
  }

  toggleCreatePreview(): void {
    this.showCreatePreview.update(v => !v);
    if (this.showCreatePreview()) {
      this.createPreviewHtml = this.sanitizer.bypassSecurityTrustHtml(marked.parse(this.newAgentContent.trim()) as string);
    }
  }

  insertMarkdown(target: 'edit' | 'create', prefix: string, suffix: string, placeholder: string): void {
    const ref = target === 'edit' ? this.editTextareaRef : this.createTextareaRef;
    if (!ref) return;
    const el = ref.nativeElement;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = target === 'edit' ? this.editContent : this.newAgentContent;
    const selected = value.substring(start, end);
    const insert = selected ? prefix + selected + suffix : prefix + placeholder + suffix;
    const newValue = value.substring(0, start) + insert + value.substring(end);

    if (target === 'edit') {
      this.editContent = newValue;
    } else {
      this.newAgentContent = newValue;
    }

    requestAnimationFrame(() => {
      el.focus();
      if (selected) {
        el.selectionStart = start + prefix.length;
        el.selectionEnd = start + prefix.length + selected.length;
      } else {
        el.selectionStart = start + prefix.length;
        el.selectionEnd = start + prefix.length + placeholder.length;
      }
    });
  }

  // --- Edit ---
  startEdit(): void {
    const agent = this.agents.selectedAgent();
    if (agent) {
      const draft = localStorage.getItem('agent_draft_' + agent.filename);
      if (draft && draft !== agent.content) {
        this.confirmAction.set({
          message: 'Restore unsaved draft?',
          onConfirm: () => {
            this.editContent = draft;
            this.isEditing.set(true);
            this.showDeleteConfirm.set(false);
            this.showEditPreview.set(false);
            this.confirmAction.set(null);
          },
        });
        // If user dismisses, use original content
        return;
      }
      this.editContent = agent.content;
      this.isEditing.set(true);
      this.showDeleteConfirm.set(false);
      this.showEditPreview.set(false);
    }
  }

  dismissConfirm(): void {
    const action = this.confirmAction();
    this.confirmAction.set(null);
    // For startEdit dismiss: load original content
    const agent = this.agents.selectedAgent();
    if (agent && !this.isEditing()) {
      this.editContent = agent.content;
      this.isEditing.set(true);
      this.showDeleteConfirm.set(false);
      this.showEditPreview.set(false);
    }
  }

  cancelEdit(): void {
    const agent = this.agents.selectedAgent();
    if (agent && this.editContent !== agent.content) {
      this.confirmAction.set({
        message: 'Discard unsaved changes?',
        onConfirm: () => {
          if (agent) localStorage.removeItem('agent_draft_' + agent.filename);
          this.isEditing.set(false);
          this.editContent = '';
          this.showEditPreview.set(false);
          this.confirmAction.set(null);
        },
      });
      return;
    }
    if (agent) localStorage.removeItem('agent_draft_' + agent.filename);
    this.isEditing.set(false);
    this.editContent = '';
    this.showEditPreview.set(false);
  }

  saveEdit(): void {
    const agent = this.agents.selectedAgent();
    if (agent) {
      this.tg.haptic();
      this.agents.saveAgent(agent.filename, this.editContent);
      localStorage.removeItem('agent_draft_' + agent.filename);
      this.isEditing.set(false);
      this.toast.show('Agent saved!', 'success');
    }
  }

  // --- Validation ---
  validateAgentContent(content: string): string | null {
    if (!/^# .+/m.test(content)) return 'Missing required field: Title';
    if (!/\*\*Model\*\*\s*:\s*\S+/.test(content)) return 'Missing required field: Model';
    if (!/\*\*Priority\*\*\s*:\s*(high|medium|low)/.test(content)) return 'Missing required field: Priority (high, medium, or low)';
    if (!/\*\*Purpose\*\*\s*:\s*\S+/.test(content)) return 'Missing required field: Purpose';
    if (!/\*\*Behavior\*\*/.test(content)) return 'Missing required field: Behavior';
    return null;
  }

  get createValidationError(): string | null {
    return this.validateAgentContent(this.newAgentContent);
  }

  get isCreateDisabled(): boolean {
    return !this.newAgentName.trim() || !!this.createValidationError || this.agents.isSaving();
  }

  // --- Create ---
  startCreate(): void {
    this.isCreating.set(true);
    this.newAgentName = '';
    this.newAgentContent = AGENT_TEMPLATE;
    this.showCreatePreview.set(false);
  }

  onTemplateSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const tpl = AGENT_TEMPLATES.find(t => t.name === select.value);
    if (tpl) {
      this.isCreating.set(true);
      this.newAgentName = tpl.name;
      this.newAgentContent = tpl.content;
    }
    select.value = '';
  }

  cancelCreate(): void {
    if (this.newAgentContent !== AGENT_TEMPLATE || this.newAgentName.trim()) {
      this.confirmAction.set({
        message: 'Discard unsaved changes?',
        onConfirm: () => {
          this.isCreating.set(false);
          this.newAgentName = '';
          this.newAgentContent = AGENT_TEMPLATE;
          this.showCreatePreview.set(false);
          this.confirmAction.set(null);
        },
      });
      return;
    }
    this.isCreating.set(false);
    this.newAgentName = '';
    this.newAgentContent = AGENT_TEMPLATE;
    this.showCreatePreview.set(false);
  }

  submitCreate(): void {
    const name = this.newAgentName.trim();
    if (!name) return;
    this.tg.haptic();
    this.agents.createAgent(name, this.newAgentContent);
    this.isCreating.set(false);
    this.toast.show('Agent created!', 'success');
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
      this.tg.haptic();
      this.agents.deleteAgent(agent.filename);
      this.showDeleteConfirm.set(false);
      this.toast.show('Agent deleted!', 'success');
    }
  }

  // --- Run ---
  runAgent(agent: AgentDetail): void {
    this.tg.haptic();
    const modelMatch = agent.content?.match(/\*\*Model\*\*:\s*(\S+)/);
    const model = modelMatch?.[1] || 'claude-sonnet-4-6';
    const safeName = agent.filename.endsWith('.md') ? agent.filename : agent.filename + '.md';
    const cmd = `/subagents spawn main "Read and execute Agents/${safeName}" --model ${model}`;
    this.chat.isOpen.set(true);
    this.chat.pendingInput.set(cmd);
    this.toast.show('Command copied to chat', 'info');
  }

  // --- Invite ---
  sendInvite(): void {
    const email = this.inviteEmail.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.toast.show('Please enter a valid email address', 'error');
      return;
    }
    this.tg.haptic();
    const msg = this.inviteMessage.trim();
    const cmd = msg ? `/invite ${email} "${msg}"` : `/invite ${email}`;
    this.chat.send(cmd);
    this.chat.isOpen.set(true);
    this.inviteEmail = '';
    this.inviteMessage = '';
    this.toast.show('Invite sent!', 'success');
  }

  private resetState(): void {
    this.isEditing.set(false);
    this.isCreating.set(false);
    this.showDeleteConfirm.set(false);
    this.editContent = '';
    this.agents.operationError.set(null);
  }

  // --- Tabs ---
  switchTab(tab: PanelTab): void {
    this.tg.haptic();
    this.activeTab.set(tab);
  }

  // --- Recommendations ---
  recommendations = computed<Recommendation[]>(() => {
    const recs: Recommendation[] = [];

    const msgs = this.chat.messages();
    const userMsgs = msgs
      .filter(m => m.sender === 'user')
      .slice(-10)
      .map(m => m.text.toLowerCase());
    const botMsgs = msgs
      .filter(m => m.sender === 'bot')
      .slice(-5)
      .map(m => m.text.toLowerCase());
    const recentText = userMsgs.join(' ');
    const recentBotText = botMsgs.join(' ');

    // Keyword-based contextual prompts
    const KEYWORD_MAP: { keywords: string[]; icon: string; text: string; prompt: string }[] = [
      { keywords: ['email', 'mail', 'inbox'], icon: '📧', text: 'Draft a reply to the last email', prompt: 'Draft a reply to the last email we discussed' },
      { keywords: ['code', 'review', 'pr', 'pull request'], icon: '🔍', text: 'Review my latest code changes', prompt: 'Review my latest code changes' },
      { keywords: ['schedule', 'meeting', 'calendar', 'call'], icon: '📅', text: 'Prepare for my next meeting', prompt: 'Help me prepare for my next meeting' },
      { keywords: ['document', 'doc', 'write', 'draft'], icon: '📝', text: 'Help draft a document', prompt: 'Help me draft a document based on our discussion' },
      { keywords: ['bug', 'error', 'fix', 'issue'], icon: '🐛', text: 'Debug the issue we discussed', prompt: 'Help me debug the issue we were discussing' },
      { keywords: ['data', 'analyze', 'report', 'chart'], icon: '📊', text: 'Analyze the data', prompt: 'Analyze the data we were discussing and create a summary' },
    ];

    if (recentText) {
      for (const entry of KEYWORD_MAP) {
        if (entry.keywords.some(kw => recentText.includes(kw))) {
          recs.push({ icon: entry.icon, text: entry.text, prompt: entry.prompt });
        }
      }
    }

    // Contextual follow-up prompts based on conversation flow
    const lastUserMsg = userMsgs[userMsgs.length - 1] || '';
    const lastBotMsg = botMsgs[botMsgs.length - 1] || '';

    if (lastBotMsg || lastUserMsg) {
      // If the bot gave a list or explanation, suggest going deeper
      if (lastBotMsg.includes('1.') || lastBotMsg.includes('- ') || lastBotMsg.length > 500) {
        recs.push({ icon: '🔎', text: 'Explain the first point in more detail', prompt: 'Can you explain the first point in more detail?' });
      }
      // If there's code in the conversation
      if (recentBotText.includes('```') || recentText.includes('code') || recentText.includes('function')) {
        recs.push(
          { icon: '🧪', text: 'Write tests for this code', prompt: 'Write unit tests for the code we just discussed' },
          { icon: '🔧', text: 'Refactor and improve it', prompt: 'How can this code be refactored or improved?' },
        );
      }
      // If discussion involved writing/content
      if (recentText.includes('write') || recentText.includes('draft') || recentBotText.includes('dear') || recentBotText.includes('subject:')) {
        recs.push(
          { icon: '✏️', text: 'Make it more concise', prompt: 'Can you make that shorter and more concise?' },
          { icon: '🎯', text: 'Change the tone to formal', prompt: 'Rewrite that in a more formal/professional tone' },
        );
      }
      // If the bot mentioned alternatives or options
      if (recentBotText.includes('alternatively') || recentBotText.includes('option') || recentBotText.includes('approach')) {
        recs.push({ icon: '🔄', text: 'Compare the alternatives', prompt: 'Can you compare the alternatives and recommend one?' });
      }
      // General follow-up prompts when there's active conversation
      if (msgs.length >= 2) {
        recs.push(
          { icon: '➡️', text: 'What should I do next?', prompt: 'Based on our conversation, what should I do next?' },
          { icon: '💡', text: 'Any other suggestions?', prompt: 'Do you have any other suggestions or ideas related to what we discussed?' },
        );
      }
      // If the conversation is about a specific topic, suggest expanding
      if (lastUserMsg.length > 20) {
        recs.push({ icon: '🌐', text: 'Give me more examples', prompt: 'Can you give me more examples of that?' });
      }
    }

    // Static recommendations (always shown)
    recs.push(
      { icon: '❓', text: this.i18n.t('recommendations.help'), prompt: '/help' },
      { icon: '📊', text: this.i18n.t('recommendations.usage'), prompt: '/usage' },
      { icon: '🤖', text: this.i18n.t('recommendations.newAgent'), prompt: '', action: () => { this.switchTab('agents'); this.startCreate(); } },
      { icon: '📋', text: this.i18n.t('recommendations.summarize'), prompt: 'Summarize our conversation so far' },
    );

    return recs;
  });

  executeRecommendation(rec: Recommendation): void {
    this.tg.haptic();
    if (rec.action) {
      rec.action();
      return;
    }
    if (rec.prompt) {
      this.chat.send(rec.prompt);
      this.chat.isOpen.set(true);
    }
  }
}
