import { Component, inject, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(ChatService);
  i18n = inject(I18nService);

  messageText = '';

  @ViewChild('messageList') messageList!: ElementRef<HTMLDivElement>;

  private prevMessageCount = 0;

  ngOnInit() {
    // TODO: enable when chat.xaiworkspace.com is live
    // this.chat.connect();
  }

  ngOnDestroy() {
    // this.chat.disconnect();
  }

  ngAfterViewChecked() {
    const count = this.chat.messages().length;
    if (count !== this.prevMessageCount) {
      this.prevMessageCount = count;
      this.scrollToBottom();
    }
  }

  send(): void {
    const text = this.messageText.trim();
    if (!text) return;
    this.chat.send(text);
    this.messageText = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom(): void {
    const el = this.messageList?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
