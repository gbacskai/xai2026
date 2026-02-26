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

interface AgentTemplate { name: string; label: string; content: string; }

const AGENT_TEMPLATES: AgentTemplate[] = [
  { name: 'email-triage', label: 'Email Triage', content: `# Email Triage\n**Model**: claude-sonnet-4-6\n**Purpose**: Categorize and prioritize incoming emails\n**Trigger**: Run at the start of each workday\n**Behavior**: Scan inbox, label by urgency (high/medium/low), flag items needing immediate response, and produce a prioritized summary with recommended actions.` },
  { name: 'email-drafter', label: 'Email Drafter', content: `# Email Drafter\n**Model**: claude-sonnet-4-6\n**Purpose**: Draft professional email replies\n**Trigger**: When a reply is needed for an incoming email\n**Behavior**: Analyze the incoming email context, draft a clear and professional reply matching the appropriate tone, and present it for review before sending.` },
  { name: 'email-followup', label: 'Email Follow-up', content: `# Email Follow-up\n**Model**: claude-sonnet-4-6\n**Purpose**: Track and remind about unanswered emails\n**Trigger**: Run daily in the afternoon\n**Behavior**: Scan sent emails with no reply after 48 hours, compile a follow-up list sorted by importance, and draft gentle follow-up messages for each.` },
  { name: 'email-summary', label: 'Email Summary', content: `# Email Summary\n**Model**: claude-sonnet-4-6\n**Purpose**: Summarize long email threads\n**Trigger**: When an email thread exceeds 5 messages\n**Behavior**: Read the full thread, extract key decisions, action items, and open questions, then produce a concise bullet-point summary.` },
  { name: 'calendar-scheduler', label: 'Calendar Scheduler', content: `# Calendar Scheduler\n**Model**: claude-sonnet-4-6\n**Purpose**: Find optimal meeting times and schedule events\n**Trigger**: When a meeting request is received\n**Behavior**: Check calendar availability, suggest the best open slots considering time zones and preferences, and create the calendar event once confirmed.` },
  { name: 'meeting-prep', label: 'Meeting Prep', content: `# Meeting Prep\n**Model**: claude-sonnet-4-6\n**Purpose**: Prepare briefing materials before meetings\n**Trigger**: 30 minutes before each scheduled meeting\n**Behavior**: Gather relevant documents, past meeting notes, and attendee context, then compile a one-page briefing with agenda items and talking points.` },
  { name: 'conflict-resolver', label: 'Conflict Resolver', content: `# Conflict Resolver\n**Model**: claude-sonnet-4-6\n**Purpose**: Detect and resolve calendar conflicts\n**Trigger**: When a new event overlaps with an existing one\n**Behavior**: Identify the conflicting events, evaluate priority of each, suggest rescheduling options, and propose resolution with minimal disruption.` },
  { name: 'todo-manager', label: 'Todo Manager', content: `# Todo Manager\n**Model**: claude-sonnet-4-6\n**Purpose**: Organize and prioritize task lists\n**Trigger**: When tasks are added or updated\n**Behavior**: Maintain a prioritized task list, group by project or context, flag overdue items, and suggest the next most important task to work on.` },
  { name: 'daily-planner', label: 'Daily Planner', content: `# Daily Planner\n**Model**: claude-sonnet-4-6\n**Purpose**: Create a structured plan for the day\n**Trigger**: Run at the start of each workday\n**Behavior**: Review calendar events, pending tasks, and deadlines, then create a time-blocked daily schedule with buffer time for unexpected work.` },
  { name: 'weekly-review', label: 'Weekly Review', content: `# Weekly Review\n**Model**: claude-sonnet-4-6\n**Purpose**: Summarize accomplishments and plan the week ahead\n**Trigger**: Run every Friday afternoon\n**Behavior**: Review completed tasks, track progress on goals, identify blockers, and draft a summary of the week along with priorities for next week.` },
  { name: 'doc-drafter', label: 'Document Drafter', content: `# Document Drafter\n**Model**: claude-sonnet-4-6\n**Purpose**: Draft documents from outlines or notes\n**Trigger**: When provided with an outline or rough notes\n**Behavior**: Expand the outline into a well-structured document with proper formatting, headings, and clear language appropriate for the target audience.` },
  { name: 'meeting-notes', label: 'Meeting Notes', content: `# Meeting Notes\n**Model**: claude-sonnet-4-6\n**Purpose**: Capture and organize meeting notes\n**Trigger**: During or after a meeting\n**Behavior**: Record key discussion points, decisions made, action items with owners and deadlines, and distribute the formatted notes to all attendees.` },
  { name: 'proofreader', label: 'Proofreader', content: `# Proofreader\n**Model**: claude-sonnet-4-6\n**Purpose**: Review documents for grammar, clarity, and tone\n**Trigger**: Before sending or publishing any document\n**Behavior**: Check for spelling, grammar, and punctuation errors, suggest improvements for clarity and conciseness, and ensure consistent tone throughout.` },
  { name: 'slack-summary', label: 'Slack Summary', content: `# Slack Summary\n**Model**: claude-sonnet-4-6\n**Purpose**: Summarize unread Slack channels\n**Trigger**: Run at the start of each workday\n**Behavior**: Scan unread messages across channels, extract important announcements, decisions, and mentions, then produce a digest organized by channel with action items highlighted.` },
  { name: 'standup-writer', label: 'Standup Writer', content: `# Standup Writer\n**Model**: claude-sonnet-4-6\n**Purpose**: Generate daily standup updates\n**Trigger**: Run each morning before standup\n**Behavior**: Review yesterday's completed tasks, today's calendar and planned work, and any blockers, then format a concise standup update in the team's standard format.` },
  { name: 'client-followup', label: 'Client Follow-up', content: `# Client Follow-up\n**Model**: claude-sonnet-4-6\n**Purpose**: Draft follow-up messages to clients\n**Trigger**: After a client meeting or milestone\n**Behavior**: Summarize what was discussed or delivered, outline next steps, and draft a professional follow-up email that maintains the relationship and keeps momentum.` },
  { name: 'invoice-tracker', label: 'Invoice Tracker', content: `# Invoice Tracker\n**Model**: claude-sonnet-4-6\n**Purpose**: Track invoices and payment status\n**Trigger**: Run weekly on Mondays\n**Behavior**: Review outstanding invoices, check payment due dates, flag overdue items, and produce a summary with recommended follow-up actions for unpaid invoices.` },
  { name: 'expense-logger', label: 'Expense Logger', content: `# Expense Logger\n**Model**: claude-sonnet-4-6\n**Purpose**: Log and categorize expenses\n**Trigger**: When a receipt or expense is submitted\n**Behavior**: Extract amount, date, vendor, and category from the receipt, log it in the expense tracker, and flag any items that need approval or exceed budget thresholds.` },
  { name: 'web-researcher', label: 'Web Researcher', content: `# Web Researcher\n**Model**: claude-sonnet-4-6\n**Purpose**: Research topics and compile findings\n**Trigger**: When research is requested on a topic\n**Behavior**: Search for relevant sources, evaluate credibility, extract key information, and compile a structured research brief with citations and key takeaways.` },
  { name: 'competitor-watch', label: 'Competitor Watch', content: `# Competitor Watch\n**Model**: claude-sonnet-4-6\n**Purpose**: Monitor competitor activity and news\n**Trigger**: Run weekly\n**Behavior**: Scan news, social media, and public filings for competitor updates, summarize product launches, pricing changes, and strategic moves, then highlight items requiring attention.` },
  { name: 'code-reviewer', label: 'Code Reviewer', content: `# Code Reviewer\n**Model**: claude-sonnet-4-6\n**Purpose**: Review code changes for quality and issues\n**Trigger**: When a pull request or code change is submitted\n**Behavior**: Analyze the diff for bugs, security issues, style violations, and performance concerns, then provide constructive feedback with specific suggestions for improvement.` },
  { name: 'bug-triager', label: 'Bug Triager', content: `# Bug Triager\n**Model**: claude-sonnet-4-6\n**Purpose**: Categorize and prioritize bug reports\n**Trigger**: When a new bug report is filed\n**Behavior**: Analyze the bug description, assess severity and impact, assign priority level, suggest which team or developer should investigate, and check for duplicate reports.` },
  { name: 'wellness-check', label: 'Wellness Check', content: `# Wellness Check\n**Model**: claude-sonnet-4-6\n**Purpose**: Prompt healthy work habits and breaks\n**Trigger**: Every 2 hours during work time\n**Behavior**: Check how long since the last break, suggest stretching or walking, remind about hydration, and offer a brief mindfulness exercise if stress indicators are detected.` },
  { name: 'social-poster', label: 'Social Media Poster', content: `# Social Media Poster\n**Model**: claude-sonnet-4-6\n**Purpose**: Draft social media posts\n**Trigger**: When content needs to be shared on social media\n**Behavior**: Adapt the content for each platform's format and audience, suggest relevant hashtags, recommend optimal posting times, and present drafts for approval before publishing.` },
  { name: 'crm-updater', label: 'CRM Updater', content: `# CRM Updater\n**Model**: claude-sonnet-4-6\n**Purpose**: Keep CRM records up to date\n**Trigger**: After client interactions or deal updates\n**Behavior**: Extract key details from emails, meetings, and notes, update the relevant CRM fields including contact info, deal stage, and next steps, and flag records that need manual review.` },
];

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

  // Templates
  templates = AGENT_TEMPLATES;

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
