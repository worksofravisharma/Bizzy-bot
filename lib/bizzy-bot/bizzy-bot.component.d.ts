import { HttpClient } from '@angular/common/http';
import { ElementRef, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BizzyBotWidgetConfig } from '../config/bizzy-bot-widget-config';
import * as i0 from "@angular/core";
/** Hardcoded user id until auth is wired. */
export declare const BIZZY_BOT_AGENT_USER_ID = "1";
/** Default `query` when the API is called right after a successful file upload. */
export declare const BIZZY_BOT_AGENT_UPLOAD_QUERY = "What can you extract or tell me about this document?";
/** Local feedback service (thumbs up / down). */
export declare const BIZZY_BOT_FEEDBACK_API_BASE = "https://service-agentic-x-git-1067454512065.europe-west1.run.app";
/** Agent query endpoint (Cloud Run). */
export declare const BIZZY_BOT_AGENT_QUERY_URL: string;
export declare const BIZZY_BOT_FEEDBACK_URL: string;
/** GET `/ping` on the same host as {@link BIZZY_BOT_FEEDBACK_URL} (optional health check). */
export declare const BIZZY_BOT_FEEDBACK_PING_URL: string;
declare type FileUploadState = 'uploading' | 'done' | 'error';
declare type FileUploadMeta = {
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
declare type ChatMessage = {
    content: string;
    isUser: boolean;
    feedback?: 'up' | 'down';
    /**
     * Set for assistant bubbles produced by the agent: exact context sent to POST /feedback
     * (`query` = user text + optional file line; `response` = this reply text).
     */
    feedbackTurn?: {
        query: string;
        response: string;
    };
    /** When set, bubble shows file card + upload progress instead of plain text. */
    fileUpload?: FileUploadMeta;
    /** When set, bubble uses link-card layout (distinct from plain text). */
    linkUrl?: string;
    /** Optional label shown above the URL (e.g. page title). */
    linkTitle?: string;
    /** Welcome bubble from config: hide ⋮ / thumbs / copy on this message only. */
    suppressBotBubbleActions?: boolean;
};
export declare class BizzyBotComponent implements OnInit, OnChanges, OnDestroy {
    private readonly ngZone;
    private readonly host;
    private readonly http;
    private readonly sanitizer;
    private static readonly SESSION_ACCESS_TOKEN_KEY;
    /** JSON string or object: merged over {@link BIZZY_BOT_DEFAULT_WIDGET_CONFIG} (see `bizzy-bot-default.config.json`). */
    config: string | BizzyBotWidgetConfig | null | undefined;
    /** Resolved after merge; used in template. */
    widgetConfig: BizzyBotWidgetConfig;
    /** Feature toggles for toolbar / FAB (defaults from JSON). */
    ui: {
        showLaunchButton: boolean;
        showThemeToggle: boolean;
        showReloadButton: boolean;
        showCloseButton: boolean;
        showBubbleMenu: boolean;
        showCopyButton: boolean;
        showClearInputButton: boolean;
        showToolsMenu: boolean;
        showFileUpload: boolean;
        showVoiceInput: boolean;
        showDockSideToggle: boolean;
    };
    isChatOpen: boolean;
    /** Shown in the header while the panel is open; updated via GET `BIZZY_BOT_FEEDBACK_PING_URL`. */
    backendConnectionStatus: 'checking' | 'online' | 'offline';
    isDarkTheme: boolean;
    isTyping: boolean;
    isToolsOpen: boolean;
    /** Fixed position of the launcher + chat panel: `right` (default) or `left`. */
    chatDockSide: 'left' | 'right';
    /** Which bot message index has the ⋮ actions menu open (null = closed). */
    openBubbleMenuIndex: number | null;
    isListening: boolean;
    voiceInputSupported: boolean;
    messageInput: string;
    private botReplyTimer?;
    private uploadProgressTimers;
    /** Latest successful file upload (used as payslip on next `handleSendMessage`). */
    private lastPayslipAttachment;
    /** Reject reads above this size (base64 ~33% larger in memory). */
    private readonly maxUploadBytes;
    private speechRecognition?;
    /** Finalized speech for the current mic session; applied to the input on stop. */
    private speechSessionAccumulated;
    /** Bumped when the panel closes or a new ping starts so stale HTTP callbacks are ignored. */
    private pingGeneration;
    messages: ChatMessage[];
    chatContainer?: ElementRef<HTMLDivElement>;
    fileInputEl?: ElementRef<HTMLInputElement>;
    constructor(ngZone: NgZone, host: ElementRef<HTMLElement>, http: HttpClient, sanitizer: DomSanitizer);
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    /** Brand + tagline + logos from merged config. */
    get brandIconSrc(): string;
    get fabLogoSrc(): string;
    /**
     * Apply default JSON + optional `config` input: theme CSS variables on host, copy, toggles.
     * @param initial when true, seeds the first bot message from `welcomeMessage`.
     */
    private applyWidgetConfig;
    private syncUiFlags;
    /** Maps theme keys (kebab-case) to CSS custom properties on the widget host (same idea as apply-loan `setThemeVariables`). */
    private applyThemeToHost;
    private resetWelcomeMessage;
    toggleChat(): void;
    closeChat(): void;
    /** GET `/ping` when the chat panel opens (or after reload) for header online / offline. */
    private runBackendPing;
    /**
     * If `sessionStorage` has `access_token`, send `Authorization: Bearer …` on API calls.
     * Read on each request so a token set after load is used on the next call.
     */
    private getBearerAuthHttpHeaders;
    toggleTheme(): void;
    clearInput(): void;
    openTools(): void;
    toggleChatDockSide(): void;
    onDocumentClick(event: MouseEvent): void;
    toggleBubbleMenu(index: number, event: MouseEvent): void;
    closeBubbleMenu(): void;
    setBotFeedback(index: number, value: 'up' | 'down'): void;
    copyBotMessageFromMenu(message: ChatMessage): Promise<void>;
    triggerFileUpload(): void;
    handleFileSelect(event: Event): void;
    /** Font Awesome class for the file row (by extension). */
    fileUploadIconClass(message: ChatMessage): string;
    /** CSS modifier for icon tint (`file-upload-bubble--pdf`, etc.). */
    fileUploadKind(message: ChatMessage): 'pdf' | 'image' | 'csv' | 'excel' | 'file';
    private addFileUploadMessage;
    /**
     * Reads file as a data URL (`data:<mime>;base64,...`), marks upload done, remembers
     * payslip MIME/base64 for follow-up sends, and POSTs to the agent immediately.
     */
    private encodeFileToBase64;
    private convertFileToDataUrl;
    /** Split `data:<mime>[;params];base64,<payload>` — MIME is the type before the first `;`. */
    private static parseDataUrl;
    private clearUploadProgressTimers;
    /**
     * Cosmetic progress while `FileReader` runs; caps below 100% until `encodeFileToBase64` finishes.
     */
    private runUploadProgressSimulation;
    /** PDF, common images, CSV, Excel only. */
    private isAllowedUploadFile;
    toggleVoiceInput(): void;
    /** Show intro text above link card when it is not just the raw URL. */
    messageLinkIntroVisible(message: ChatMessage): boolean;
    /** Hostname for link preview line. */
    linkMessageHost(message: ChatMessage): string;
    copyBotMessage(message: ChatMessage): Promise<void>;
    handleSendMessage(): void;
    reloadChat(): void;
    private addMessage;
    /**
     * If the whole message is a single URL (or www… / domain-only), returns a normalized https URL.
     */
    private normalizeMessageAsLinkUrl;
    private fetchAgentReply;
    /**
     * POST `/agent/query` with optional payslip payload (used after upload and on send).
     * @param feedbackFileLabel File name for feedback `query` when a payslip is attached.
     */
    private postAgentQuery;
    private addBotAgentMessage;
    /** Human-readable `query` field for POST /feedback (user text + optional file line, no base64). */
    private static buildAgentFeedbackQueryLabel;
    private findLatestCompletedUploadFileName;
    /**
     * Fallback when `feedbackTurn` is missing (e.g. welcome): walk back user bubbles before this bot message.
     */
    private inferFeedbackQueryFromPriorMessages;
    /** Plain text for feedback `response` (link cards, etc.). */
    private botMessageFeedbackResponseText;
    /**
     * Assistant replies may be HTML (e.g. structured financial wellness cards). Detect a small subset
     * so plain text and markdown-like replies still use escaped text.
     */
    isLikelyBotHtml(content: string | undefined): boolean;
    /** Sanitized HTML for `[innerHTML]` (bot bubbles only). */
    sanitizedBotHtml(content: string | undefined): SafeHtml;
    /** Copy / feedback string when content is HTML. */
    private messageBodyPlainText;
    /** Normalize agent JSON (or plain text) into a single assistant bubble string. */
    private extractAgentReplyText;
    /**
     * Scroll after the view has caught up (messages, innerHTML, typing row). Sync `scrollTop` alone
     * often runs before CD/layout, so it no-ops or stops short.
     */
    private scrollToBottom;
    /**
     * Scroll to the latest content. When `smooth`, uses `scrollTo({ behavior: 'smooth' })` and a late
     * snap so layout (innerHTML, typing row) does not cancel the animation. Use `smooth: false` for
     * frequent ticks (upload %) so the list tracks instantly.
     */
    private flushScrollToBottom;
    private flushSpeechToInput;
    private ensureSpeechRecognition;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<BizzyBotComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BizzyBotComponent, "lib-bizzy-bot", never, { "config": "config"; }, {}, never, never, false>;
}
export {};
