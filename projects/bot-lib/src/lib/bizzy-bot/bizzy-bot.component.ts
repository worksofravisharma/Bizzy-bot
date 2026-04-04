import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  BIZZY_BOT_DEFAULT_WIDGET_CONFIG,
  BizzyBotThemeConfig,
  BizzyBotWidgetConfig,
  mergeBizzyBotWidgetConfig,
  parseBizzyBotConfigInput,
} from '../config/bizzy-bot-widget-config';



/** Hardcoded user id until auth is wired. */
export const BIZZY_BOT_AGENT_USER_ID = '1';

/** Default `query` when the API is called right after a successful file upload. */
export const BIZZY_BOT_AGENT_UPLOAD_QUERY =
  'What can you extract or tell me about this document?';

/** Shown in the chat bubble when the agent request fails (raw API / network errors are not shown). */
const BIZZY_BOT_AGENT_ERROR_USER_MESSAGE =
  "We're having trouble completing that request. Please try again in a moment.";

/** Local feedback service (thumbs up / down). */
export const BIZZY_BOT_FEEDBACK_API_BASE = 'https://service-agentic-x-git-1067454512065.europe-west1.run.app';

/** Agent query endpoint (Cloud Run). */
export const BIZZY_BOT_AGENT_QUERY_URL =
  `${BIZZY_BOT_FEEDBACK_API_BASE}/agent/query`;

export const BIZZY_BOT_FEEDBACK_URL = `${BIZZY_BOT_FEEDBACK_API_BASE}/feedback`;

/** GET `/ping` on the same host as {@link BIZZY_BOT_FEEDBACK_URL} (optional health check). */
export const BIZZY_BOT_FEEDBACK_PING_URL = `${BIZZY_BOT_FEEDBACK_API_BASE}/ping`;

/** Default header icon when `brandIconUrl` is not set in config. */
const DEFAULT_BRAND_ICON_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAUVBMVEVHcEwih0eewz+dxD+exD+bxT2cxTpuqkMjh0aexDwgiUYkhkklhkcgiUYih0icxToih0ggiEWfxDicxjYegzuaxEqZyEEqg0p8uEU6kT9ao0FekJFHAAAAD3RSTlMAqzXOZKDrEU5/ddyKgcO7y4dBAAAA70lEQVQ4jYWR0XaEIAxEsSqu3bYJEVL0/z+0QbdrQA/Mi8pcZgIac2oYewCw/fxh7jTCKXtFJgv89heiuQSsLC//AMnbUOQvUGrKCo7drGpg1MAM1wTSQC9zwZFxAvokQQBmoEQRLVIoH0MB7PZ7CibQJw1iEjBzFAVOUAEkO2yr37XGkICiIkTvMcmh85ssZBcRiLfDPuR9BKuPGcR3qOVDdteS75Jerjzdmv2KsOb7E/TQQPSlj/jUQDnBLn2KawO6rOP3JsB9NgD8bgHNhNYMaOqA6zLgJmBqAF+mAkjhj6kBiJ2pAw9TAZ5dZv8B/CIoPtddaqYAAAAASUVORK5CYII=';

type FileUploadState = 'uploading' | 'done' | 'error';

type FileUploadMeta = {
  fileName: string;
  progress: number;
  state: FileUploadState;
  /** From `FileReader.readAsDataURL`: `data:<mime>;base64,<payload>` */
  dataUrl?: string;
  /** Parsed MIME, e.g. `application/pdf` */
  mimeType?: string;
  /** Base64 payload only (no `data:...;base64,` prefix) */
  base64Payload?: string;
};

type ChatMessage = {
  content: string;
  isUser: boolean;
  feedback?: 'up' | 'down';
  /**
   * Set for assistant bubbles produced by the agent: exact context sent to POST /feedback
   * (`query` = user text + optional file line; `response` = this reply text).
   */
  feedbackTurn?: { query: string; response: string };
  /** When set, bubble shows file card + upload progress instead of plain text. */
  fileUpload?: FileUploadMeta;
  /** When set, bubble uses link-card layout (distinct from plain text). */
  linkUrl?: string;
  /** Optional label shown above the URL (e.g. page title). */
  linkTitle?: string;
  /** Welcome bubble from config: hide ⋮ / thumbs / copy on this message only. */
  suppressBotBubbleActions?: boolean;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLite) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultLite = {
  0: { transcript?: string };
  isFinal?: boolean;
};

type SpeechRecognitionEventLite = {
  resultIndex: number;
  results: SpeechRecognitionResultLite[];
};

@Component({
  selector: 'lib-bizzy-bot',
  templateUrl: './bizzy-bot.component.html',
  styleUrls: ['./bizzy-bot.component.scss']
})
export class BizzyBotComponent implements OnInit, OnChanges, OnDestroy {
  private static readonly SESSION_ACCESS_TOKEN_KEY = 'access_token';

  /** JSON string or object: merged over {@link BIZZY_BOT_DEFAULT_WIDGET_CONFIG} (see `bizzy-bot-default.config.json`). */
  @Input() config: string | BizzyBotWidgetConfig | null | undefined = null;

  /** Resolved after merge; used in template. */
  widgetConfig: BizzyBotWidgetConfig = BIZZY_BOT_DEFAULT_WIDGET_CONFIG;

  /** Feature toggles for toolbar / FAB (defaults from JSON). */
  ui = {
    showLaunchButton: true,
    showThemeToggle: true,
    showReloadButton: true,
    showCloseButton: true,
    showBubbleMenu: true,
    showCopyButton: true,
    showClearInputButton: true,
    showToolsMenu: true,
    showFileUpload: true,
    showVoiceInput: true,
    showDockSideToggle: true,
  };

  isChatOpen = false;
  /** Shown in the header while the panel is open; updated via GET `BIZZY_BOT_FEEDBACK_PING_URL`. */
  backendConnectionStatus: 'checking' | 'online' | 'offline' = 'offline';
  isDarkTheme = false;
  isTyping = false;
  isToolsOpen = false;
  /** Fixed position of the launcher + chat panel: `right` (default) or `left`. */
  chatDockSide: 'left' | 'right' = 'right';
  /** Which bot message index has the ⋮ actions menu open (null = closed). */
  openBubbleMenuIndex: number | null = null;
  isListening = false;
  voiceInputSupported = false;
  messageInput = '';
  private botReplyTimer?: ReturnType<typeof setTimeout>;
  private uploadProgressTimers: ReturnType<typeof setTimeout>[] = [];
  /** Latest successful file upload (used as payslip on next `handleSendMessage`). */
  private lastPayslipAttachment: { mimeType: string; base64Payload: string } | null = null;
  /** Reject reads above this size (base64 ~33% larger in memory). */
  private readonly maxUploadBytes = 20 * 1024 * 1024;
  private speechRecognition?: BrowserSpeechRecognition;
  /** Finalized speech for the current mic session; applied to the input on stop. */
  private speechSessionAccumulated = '';
  /** Bumped when the panel closes or a new ping starts so stale HTTP callbacks are ignored. */
  private pingGeneration = 0;
  messages: ChatMessage[] = [];

  @ViewChild('chatContainer') chatContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInputEl') fileInputEl?: ElementRef<HTMLInputElement>;

  constructor(
    private readonly ngZone: NgZone,
    private readonly host: ElementRef<HTMLElement>,
    private readonly http: HttpClient
  ) {
    this.voiceInputSupported = this.ensureSpeechRecognition();
  }

  ngOnInit(): void {
    this.applyWidgetConfig(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.applyWidgetConfig(false);
    }
  }

  /** Brand + tagline + logos from merged config. */
  get brandIconSrc(): string {
    const u = this.widgetConfig.brandIconUrl?.trim();
    return u || DEFAULT_BRAND_ICON_SRC;
  }

  get fabLogoSrc(): string {
    return (
      this.widgetConfig.fabLogoUrl?.trim() ||
      BIZZY_BOT_DEFAULT_WIDGET_CONFIG.fabLogoUrl ||
      ''
    );
  }

  /**
   * Apply default JSON + optional `config` input: theme CSS variables on host, copy, toggles.
   * @param initial when true, seeds the first bot message from `welcomeMessage`.
   */
  private applyWidgetConfig(initial: boolean): void {
    const patch = parseBizzyBotConfigInput(this.config as string | Record<string, unknown> | null | undefined);
    this.widgetConfig = mergeBizzyBotWidgetConfig(BIZZY_BOT_DEFAULT_WIDGET_CONFIG, patch ?? undefined);
    this.applyThemeToHost(this.widgetConfig.theme ?? {});
    this.syncUiFlags(this.widgetConfig.widgets);
    if (initial) {
      this.resetWelcomeMessage();
    }
  }

  private syncUiFlags(widgets: BizzyBotWidgetConfig['widgets']): void {
    const w = widgets ?? {};
    this.ui = {
      showLaunchButton: w.showLaunchButton !== false,
      showThemeToggle: w.showThemeToggle !== false,
      showReloadButton: w.showReloadButton !== false,
      showCloseButton: w.showCloseButton !== false,
      showBubbleMenu: w.showBubbleMenu !== false,
      showCopyButton: w.showCopyButton !== false,
      showClearInputButton: w.showClearInputButton !== false,
      showToolsMenu: w.showToolsMenu !== false,
      showFileUpload: w.showFileUpload !== false,
      showVoiceInput: w.showVoiceInput !== false,
      showDockSideToggle: w.showDockSideToggle !== false,
    };
  }

  /** Maps theme keys (kebab-case) to CSS custom properties on the widget host (same idea as apply-loan `setThemeVariables`). */
  private applyThemeToHost(theme: BizzyBotThemeConfig): void {
    const el = this.host.nativeElement;
    const defaults = BIZZY_BOT_DEFAULT_WIDGET_CONFIG.theme ?? {};
    const keys = new Set([...Object.keys(defaults), ...Object.keys(theme)]);
    for (const key of keys) {
      const value = theme[key] ?? defaults[key];
      if (value == null || value === '') {
        continue;
      }
      const prop = key.startsWith('--') ? key : `--${key}`;
      el.style.setProperty(prop, value);
    }
  }

  private resetWelcomeMessage(): void {
    const text =
      this.widgetConfig.welcomeMessage ?? BIZZY_BOT_DEFAULT_WIDGET_CONFIG.welcomeMessage ?? '';
    this.messages = [{ content: text, isUser: false, suppressBotBubbleActions: true }];
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (!this.isChatOpen) {
      this.pingGeneration += 1;
      this.isToolsOpen = false;
      this.openBubbleMenuIndex = null;
    } else {
      this.runBackendPing();
    }
    setTimeout(() => this.scrollToBottom(), 0);
  }

  closeChat(): void {
    this.isChatOpen = false;
    this.pingGeneration += 1;
    this.isToolsOpen = false;
    this.openBubbleMenuIndex = null;
  }

  /** GET `/ping` when the chat panel opens (or after reload) for header online / offline. */
  private runBackendPing(): void {
    this.pingGeneration += 1;
    const gen = this.pingGeneration;
    this.backendConnectionStatus = 'checking';

    this.http
      .get(BIZZY_BOT_FEEDBACK_PING_URL, {
        observe: 'response',
        responseType: 'text',
        headers: this.getBearerAuthHttpHeaders(),
      })
      .subscribe({
        next: (res) => {
          if (!this.isChatOpen || gen !== this.pingGeneration) {
            return;
          }
          const ok = res.status >= 200 && res.status < 300;
          this.ngZone.run(() => {
            this.backendConnectionStatus = ok ? 'online' : 'offline';
          });
        },
        error: () => {
          if (!this.isChatOpen || gen !== this.pingGeneration) {
            return;
          }
          this.ngZone.run(() => {
            this.backendConnectionStatus = 'offline';
          });
        },
      });
  }

  /**
   * If `sessionStorage` has `access_token`, send `Authorization: Bearer …` on API calls.
   * Read on each request so a token set after load is used on the next call.
   */
  private getBearerAuthHttpHeaders(): HttpHeaders {
    if (typeof sessionStorage === 'undefined') {
      return new HttpHeaders();
    }
    try {
      const t = sessionStorage
        .getItem(BizzyBotComponent.SESSION_ACCESS_TOKEN_KEY)
        ?.trim();
      if (t) {
        return new HttpHeaders({ Authorization: `Bearer ${t}` });
      }
    } catch {
      /* storage blocked or unavailable */
    }
    return new HttpHeaders();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }

  clearInput(): void {
    this.messageInput = '';
  }

  openTools(): void {
    this.isToolsOpen = !this.isToolsOpen;
  }

  toggleChatDockSide(): void {
    this.chatDockSide = this.chatDockSide === 'right' ? 'left' : 'right';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement | null;
    if (!el) {
      return;
    }

    const inBubbleMenu = el.closest('.bubble-menu');
    const inTools = el.closest('.tools-panel') || el.closest('.tools-menu-trigger');

    if (!inBubbleMenu) {
      this.openBubbleMenuIndex = null;
    }
    if (!inTools) {
      this.isToolsOpen = false;
    }
  }

  toggleBubbleMenu(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openBubbleMenuIndex = this.openBubbleMenuIndex === index ? null : index;
  }

  closeBubbleMenu(): void {
    this.openBubbleMenuIndex = null;
  }

  setBotFeedback(index: number, value: 'up' | 'down'): void {
    const msg = this.messages[index];
    if (!msg || msg.isUser) {
      return;
    }
    const prev = msg.feedback;
    const next = prev === value ? undefined : value;
    msg.feedback = next;
    this.closeBubbleMenu();

    if (next === undefined) {
      return;
    }

    const rating = next === 'up' ? 1 : 0;
    const uid = Number(BIZZY_BOT_AGENT_USER_ID);
    const query =
      msg.feedbackTurn?.query ?? this.inferFeedbackQueryFromPriorMessages(index);
    const response =
      msg.feedbackTurn?.response ?? this.botMessageFeedbackResponseText(msg);

    this.http
      .post(
        BIZZY_BOT_FEEDBACK_URL,
        {
          userId: Number.isFinite(uid) ? uid : 1,
          query,
          response,
          rating,
        },
        { headers: this.getBearerAuthHttpHeaders() }
      )
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }

  async copyBotMessageFromMenu(message: ChatMessage): Promise<void> {
    await this.copyBotMessage(message);
    this.closeBubbleMenu();
  }

  triggerFileUpload(): void {
    this.fileInputEl?.nativeElement.click();
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!this.isAllowedUploadFile(file)) {
      this.addMessage('Only PDF, images, CSV, and Excel (.xls, .xlsx) files are allowed.');
      input.value = '';
      return;
    }
    if (file.size > this.maxUploadBytes) {
      this.addMessage(`File is too large. Maximum size is ${this.maxUploadBytes / (1024 * 1024)} MB.`);
      input.value = '';
      return;
    }
    this.addFileUploadMessage(file);
    input.value = '';
  }

  /** Font Awesome class for the file row (by extension). */
  fileUploadIconClass(message: ChatMessage): string {
    const name = message.fileUpload?.fileName ?? '';
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') {
      return 'fa-file-pdf';
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'fa-file-image';
    }
    if (ext === 'csv') {
      return 'fa-file-csv';
    }
    if (ext === 'xls' || ext === 'xlsx') {
      return 'fa-file-excel';
    }
    return 'fa-file';
  }

  /** CSS modifier for icon tint (`file-upload-bubble--pdf`, etc.). */
  fileUploadKind(message: ChatMessage): 'pdf' | 'image' | 'csv' | 'excel' | 'file' {
    const name = message.fileUpload?.fileName ?? '';
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') {
      return 'pdf';
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (ext === 'csv') {
      return 'csv';
    }
    if (ext === 'xls' || ext === 'xlsx') {
      return 'excel';
    }
    return 'file';
  }

  private addFileUploadMessage(file: File): void {
    const msg: ChatMessage = {
      content: '',
      isUser: true,
      fileUpload: {
        fileName: file.name,
        progress: 0,
        state: 'uploading'
      }
    };
    this.messages.push(msg);
    const index = this.messages.length - 1;
    this.scrollToBottom();
    this.runUploadProgressSimulation(index);
    this.encodeFileToBase64(file, index);
  }

  /**
   * Reads file as a data URL (`data:<mime>;base64,...`), marks upload done, remembers
   * payslip MIME/base64 for follow-up sends, and POSTs to the agent immediately.
   */
  private encodeFileToBase64(file: File, messageIndex: number): void {
    this.convertFileToDataUrl(file)
      .then((dataUrl) => {
        this.ngZone.run(() => {
          this.clearUploadProgressTimers();
          const msg = this.messages[messageIndex];
          if (!msg?.fileUpload || msg.fileUpload.state === 'error') {
            return;
          }
          const { mimeType, base64Payload } = BizzyBotComponent.parseDataUrl(dataUrl);
          msg.fileUpload = {
            ...msg.fileUpload,
            state: 'done',
            progress: 100,
            dataUrl,
            mimeType,
            base64Payload
          };
          this.lastPayslipAttachment = { mimeType, base64Payload };
          this.scrollToBottom();
          this.postAgentQuery(
            BIZZY_BOT_AGENT_UPLOAD_QUERY,
            mimeType,
            base64Payload,
            msg.fileUpload.fileName
          );
        });
      })
      .catch(() => {
        this.ngZone.run(() => {
          this.clearUploadProgressTimers();
          const msg = this.messages[messageIndex];
          if (msg?.fileUpload) {
            msg.fileUpload = {
              ...msg.fileUpload,
              state: 'error',
              progress: 0
            };
          }
          this.scrollToBottom();
        });
      });
  }

  private convertFileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Unexpected read result'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  /** Split `data:<mime>[;params];base64,<payload>` — MIME is the type before the first `;`. */
  private static parseDataUrl(dataUrl: string): { mimeType: string; base64Payload: string } {
    const marker = ';base64,';
    const i = dataUrl.indexOf(marker);
    if (i === -1 || !dataUrl.startsWith('data:')) {
      return { mimeType: 'application/octet-stream', base64Payload: dataUrl };
    }
    const meta = dataUrl.slice('data:'.length, i);
    const mimeType = meta.split(';')[0]?.trim() || 'application/octet-stream';
    const base64Payload = dataUrl.slice(i + marker.length);
    return { mimeType, base64Payload };
  }

  private clearUploadProgressTimers(): void {
    this.uploadProgressTimers.forEach((id) => clearTimeout(id));
    this.uploadProgressTimers = [];
  }

  /**
   * Cosmetic progress while `FileReader` runs; caps below 100% until `encodeFileToBase64` finishes.
   */
  private runUploadProgressSimulation(messageIndex: number): void {
    const totalMs = 1800;
    const steps = 36;
    const stepMs = Math.max(30, Math.floor(totalMs / steps));
    let step = 0;
    const maxSimulated = 92;

    const tick = (): void => {
      this.ngZone.run(() => {
        const msg = this.messages[messageIndex];
        if (!msg?.fileUpload || msg.fileUpload.state !== 'uploading') {
          return;
        }
        step += 1;
        const progress = Math.min(maxSimulated, Math.round((step / steps) * maxSimulated));
        msg.fileUpload = { ...msg.fileUpload, progress };
        if (progress >= maxSimulated) {
          return;
        }
        const id = setTimeout(() => tick(), stepMs);
        this.uploadProgressTimers.push(id);
      });
    };

    const firstId = setTimeout(() => tick(), 0);
    this.uploadProgressTimers.push(firstId);
  }

  /** PDF, common images, CSV, Excel only. */
  private isAllowedUploadFile(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedExt = new Set([
      'pdf',
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'bmp',
      'svg',
      'csv',
      'xls',
      'xlsx'
    ]);
    if (allowedExt.has(ext)) {
      return true;
    }
    const mime = file.type.toLowerCase();
    if (mime === 'application/pdf') {
      return true;
    }
    if (mime.startsWith('image/')) {
      return true;
    }
    if (mime === 'text/csv' || mime === 'application/csv') {
      return true;
    }
    if (mime === 'application/vnd.ms-excel') {
      return true;
    }
    if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return true;
    }
    return false;
  }

  toggleVoiceInput(): void {
    if (!this.voiceInputSupported || !this.speechRecognition) {
      this.addMessage('Speech to text is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.speechRecognition.stop();
      return;
    }

    this.speechSessionAccumulated = '';
    this.isListening = true;
    this.speechRecognition.start();
  }

  /** Show intro text above link card when it is not just the raw URL. */
  messageLinkIntroVisible(message: ChatMessage): boolean {
    if (!message.linkUrl || !message.content?.trim()) {
      return false;
    }
    const c = message.content.trim();
    if (c === message.linkUrl) {
      return false;
    }
    try {
      if (new URL(c).href === message.linkUrl) {
        return false;
      }
    } catch {
      /* keep true below */
    }
    return true;
  }

  /** Hostname for link preview line. */
  linkMessageHost(message: ChatMessage): string {
    if (!message.linkUrl) {
      return '';
    }
    try {
      return new URL(message.linkUrl).hostname.replace(/^www\./, '');
    } catch {
      return message.linkUrl;
    }
  }

  async copyBotMessage(message: ChatMessage): Promise<void> {
    const parts: string[] = [];
    if (message.linkUrl) {
      if (message.linkTitle?.trim()) {
        parts.push(message.linkTitle.trim());
      }
      parts.push(message.linkUrl);
    }
    const body = message.content?.trim() ?? '';
    if (body && (!message.linkUrl || body !== message.linkUrl)) {
      parts.push(body);
    }
    const text = parts.join('\n').trim();
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  handleSendMessage(): void {
    const message = this.messageInput.trim();
    if (!message) {
      return;
    }

    const normalizedUrl = this.normalizeMessageAsLinkUrl(message);
    if (normalizedUrl) {
      this.messages.push({ content: message, isUser: true, linkUrl: normalizedUrl });
      this.scrollToBottom();
    } else {
      this.addMessage(message, true);
    }
    this.messageInput = '';
    this.fetchAgentReply(message);
  }

  reloadChat(): void {
    this.clearUploadProgressTimers();
    if (this.botReplyTimer) {
      clearTimeout(this.botReplyTimer);
      this.botReplyTimer = undefined;
    }
    this.isTyping = false;
    this.messageInput = '';
    this.lastPayslipAttachment = null;
    this.resetWelcomeMessage();
    this.isToolsOpen = false;
    this.openBubbleMenuIndex = null;
    this.scrollToBottom();
    if (this.isChatOpen) {
      this.runBackendPing();
    }
  }

  private addMessage(content: string, isUser = false): void {
    this.messages.push({ content, isUser });
    this.scrollToBottom();
  }

  /**
   * If the whole message is a single URL (or www… / domain-only), returns a normalized https URL.
   */
  private normalizeMessageAsLinkUrl(raw: string): string | null {
    const t = raw.trim();
    if (!t || /\s/.test(t)) {
      return null;
    }
    try {
      if (/^https?:\/\//i.test(t)) {
        return new URL(t).href;
      }
    } catch {
      return null;
    }
    if (/^www\./i.test(t)) {
      try {
        return new URL(`https://${t}`).href;
      } catch {
        return null;
      }
    }
    if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/[^\s]*)?$/i.test(t)) {
      try {
        return new URL(`https://${t}`).href;
      } catch {
        return null;
      }
    }
    return null;
  }

  private fetchAgentReply(userQuery: string): void {
    this.postAgentQuery(
      userQuery,
      this.lastPayslipAttachment?.mimeType ?? '',
      this.lastPayslipAttachment?.base64Payload ?? ''
    );
  }

  /**
   * POST `/agent/query` with optional payslip payload (used after upload and on send).
   * @param feedbackFileLabel File name for feedback `query` when a payslip is attached.
   */
  private postAgentQuery(
    query: string,
    payslipMimeType: string,
    payslipBase64: string,
    feedbackFileLabel?: string
  ): void {
    if (this.botReplyTimer) {
      clearTimeout(this.botReplyTimer);
      this.botReplyTimer = undefined;
    }
    this.isTyping = true;
    this.scrollToBottom();

    const fileLabel =
      feedbackFileLabel ??
      (payslipBase64 ? this.findLatestCompletedUploadFileName() : undefined);
    const feedbackQuery = BizzyBotComponent.buildAgentFeedbackQueryLabel(
      query,
      payslipMimeType,
      payslipBase64,
      fileLabel
    );

    const body = {
      userId: BIZZY_BOT_AGENT_USER_ID,
      query,
      payslipMimeType,
      payslipBase64,
    };

    this.http
      .post<unknown>(BIZZY_BOT_AGENT_QUERY_URL, body, {
        headers: this.getBearerAuthHttpHeaders(),
      })
      .subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.isTyping = false;
          const text = this.extractAgentReplyText(res);
          this.addBotAgentMessage(text, { query: feedbackQuery, response: text });
          this.scrollToBottom();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isTyping = false;
          this.addBotAgentMessage(BIZZY_BOT_AGENT_ERROR_USER_MESSAGE, {
            query: feedbackQuery,
            response: BIZZY_BOT_AGENT_ERROR_USER_MESSAGE,
          });
          this.scrollToBottom();
        });
      },
    });
  }

  private addBotAgentMessage(
    content: string,
    feedbackTurn: { query: string; response: string }
  ): void {
    this.messages.push({ content, isUser: false, feedbackTurn });
    this.scrollToBottom();
  }

  /** Human-readable `query` field for POST /feedback (user text + optional file line, no base64). */
  private static buildAgentFeedbackQueryLabel(
    query: string,
    payslipMimeType: string,
    payslipBase64: string,
    fileDisplayName?: string
  ): string {
    const parts: string[] = [];
    const q = query.trim();
    if (q) {
      parts.push(q);
    }
    if (payslipBase64?.trim()) {
      const mime = payslipMimeType?.trim() || 'application/octet-stream';
      const name = fileDisplayName?.trim() || 'document';
      parts.push(`Attached file: ${name} (${mime})`);
    }
    const s = parts.join('\n\n').trim();
    return s || '(empty query)';
  }

  private findLatestCompletedUploadFileName(): string | undefined {
    for (let j = this.messages.length - 1; j >= 0; j -= 1) {
      const m = this.messages[j];
      if (!m.isUser) {
        continue;
      }
      if (m.fileUpload?.state === 'done') {
        return m.fileUpload.fileName;
      }
    }
    return undefined;
  }

  /**
   * Fallback when `feedbackTurn` is missing (e.g. welcome): walk back user bubbles before this bot message.
   */
  private inferFeedbackQueryFromPriorMessages(botMessageIndex: number): string {
    const parts: string[] = [];
    for (let i = botMessageIndex - 1; i >= 0; i -= 1) {
      const m = this.messages[i];
      if (!m.isUser) {
        break;
      }
      if (m.fileUpload?.state === 'done') {
        const fn = m.fileUpload.fileName;
        const mt = m.fileUpload.mimeType ?? 'application/octet-stream';
        parts.unshift(`Attached file: ${fn} (${mt})`);
      }
      const t = m.content?.trim();
      if (t) {
        parts.unshift(t);
      }
      if (m.linkUrl) {
        parts.unshift(m.linkUrl);
      }
    }
    return parts.length ? parts.join('\n\n') : '(no preceding user message)';
  }

  /** Plain text for feedback `response` (link cards, etc.). */
  private botMessageFeedbackResponseText(message: ChatMessage): string {
    const parts: string[] = [];
    if (message.linkUrl) {
      if (message.linkTitle?.trim()) {
        parts.push(message.linkTitle.trim());
      }
      parts.push(message.linkUrl);
    }
    const body = message.content?.trim() ?? '';
    if (body && (!message.linkUrl || body !== message.linkUrl)) {
      parts.push(body);
    }
    return parts.join('\n').trim() || message.content?.trim() || '';
  }

  /** Normalize agent JSON (or plain text) into a single assistant bubble string. */
  private extractAgentReplyText(body: unknown): string {
    if (body == null) {
      return '';
    }
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body !== 'object') {
      return String(body);
    }
    const o = body as Record<string, unknown>;
    for (const key of [
      'answer',
      'message',
      'response',
      'text',
      'reply',
      'result',
      'data',
      'output',
    ]) {
      const v = o[key];
      if (typeof v === 'string' && v.trim()) {
        return v;
      }
    }
    try {
      return JSON.stringify(body);
    } catch {
      return 'Received a response from the agent.';
    }
  }

  private scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }

  private flushSpeechToInput(): void {
    const addition = this.speechSessionAccumulated.trim();
    this.speechSessionAccumulated = '';
    if (!addition) {
      return;
    }
    const cur = this.messageInput.trim();
    this.messageInput = cur ? `${cur} ${addition}` : addition;
  }

  private ensureSpeechRecognition(): boolean {
    const win = window as Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const RecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return false;
    }

    this.speechRecognition = new RecognitionCtor();
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.interimResults = false;
    this.speechRecognition.continuous = true;

    this.speechRecognition.onresult = (event: SpeechRecognitionEventLite) => {
      this.ngZone.run(() => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal === false) {
            continue;
          }
          this.speechSessionAccumulated += result[0]?.transcript ?? '';
        }
      });
    };

    this.speechRecognition.onerror = () => {
      this.ngZone.run(() => {
        this.flushSpeechToInput();
        this.isListening = false;
      });
    };

    this.speechRecognition.onend = () => {
      this.ngZone.run(() => {
        this.flushSpeechToInput();
        this.isListening = false;
      });
    };

    return true;
  }

  ngOnDestroy(): void {
    this.clearUploadProgressTimers();
    if (this.botReplyTimer) {
      clearTimeout(this.botReplyTimer);
    }
    this.speechRecognition?.stop();
  }
}
