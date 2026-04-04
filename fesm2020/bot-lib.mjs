import * as i0 from '@angular/core';
import { Component, Input, ViewChild, HostListener, NgModule } from '@angular/core';
import * as i2 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i1 from '@angular/common/http';
import { HttpHeaders, HttpClientModule } from '@angular/common/http';
import * as i3 from '@angular/forms';
import { FormsModule } from '@angular/forms';

var brandName = "Bizzy";
var brandTagline = "Your AI-Powered Payroll Intelligence Agent.";
var brandIconUrl = "";
var fabLogoUrl = "https://cms-cdn.b2cdev.com/templates/biz2creditmain2020/images/Biz2credit-logo.svg";
var welcomeMessage = "Hello! I'm Bizzy, your AI payroll & tax agent. Upload a payslip to simulate tax scenarios or decode your deductions. How can I help you optimize your take-home pay today?";
var theme = {
	"chat-brand": "#0e7d3f",
	"chat-brand-dark": "#0a5c2e",
	"primary-gradient": "linear-gradient(135deg, #0e7d3f, #13a354)",
	"secondary-gradient": "linear-gradient(135deg, #0b6532, #0e7d3f)",
	"bg-color": "#ffffff",
	"chat-bg": "#f8fafc",
	"text-primary": "#1e293b",
	"text-secondary": "#64748b",
	"bot-message-bg": "#f1f5f9",
	"border-color": "#e2e8f0",
	"shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
	"shadow-md": "0 4px 6px rgba(0, 0, 0, 0.1)",
	"shadow-lg": "0 10px 15px rgba(0, 0, 0, 0.1)",
	"message-bubble-max-width": "21rem"
};
var widgets = {
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
	showDockSideToggle: true
};
var defaultJson = {
	brandName: brandName,
	brandTagline: brandTagline,
	brandIconUrl: brandIconUrl,
	fabLogoUrl: fabLogoUrl,
	welcomeMessage: welcomeMessage,
	theme: theme,
	widgets: widgets
};

const BIZZY_BOT_DEFAULT_WIDGET_CONFIG = defaultJson;
function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function mergeBizzyBotWidgetConfig(base, patch) {
    if (!patch || !isPlainObject(patch)) {
        return { ...base, theme: { ...base.theme }, widgets: { ...base.widgets } };
    }
    return {
        ...base,
        ...patch,
        theme: { ...base.theme, ...patch.theme },
        widgets: { ...base.widgets, ...patch.widgets },
    };
}
/** Parse `config` @Input: JSON string or object (encrypted payloads can be swapped in later). */
function parseBizzyBotConfigInput(input) {
    if (input == null || input === '') {
        return null;
    }
    if (typeof input === 'object') {
        return input;
    }
    const s = String(input).trim();
    if (!s) {
        return null;
    }
    try {
        return JSON.parse(s);
    }
    catch {
        return null;
    }
}

/** Hardcoded user id until auth is wired. */
const BIZZY_BOT_AGENT_USER_ID = '1';
/** Default `query` when the API is called right after a successful file upload. */
const BIZZY_BOT_AGENT_UPLOAD_QUERY = 'What can you extract or tell me about this document?';
/** Shown in the chat bubble when the agent request fails (raw API / network errors are not shown). */
const BIZZY_BOT_AGENT_ERROR_USER_MESSAGE = "We're having trouble completing that request. Please try again in a moment.";
/** Local feedback service (thumbs up / down). */
const BIZZY_BOT_FEEDBACK_API_BASE = 'https://service-agentic-x-git-1067454512065.europe-west1.run.app';
/** Agent query endpoint (Cloud Run). */
const BIZZY_BOT_AGENT_QUERY_URL = `${BIZZY_BOT_FEEDBACK_API_BASE}/agent/query`;
const BIZZY_BOT_FEEDBACK_URL = `${BIZZY_BOT_FEEDBACK_API_BASE}/feedback`;
/** GET `/ping` on the same host as {@link BIZZY_BOT_FEEDBACK_URL} (optional health check). */
const BIZZY_BOT_FEEDBACK_PING_URL = `${BIZZY_BOT_FEEDBACK_API_BASE}/ping`;
/** Default header icon when `brandIconUrl` is not set in config. */
const DEFAULT_BRAND_ICON_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAUVBMVEVHcEwih0eewz+dxD+exD+bxT2cxTpuqkMjh0aexDwgiUYkhkklhkcgiUYih0icxToih0ggiEWfxDicxjYegzuaxEqZyEEqg0p8uEU6kT9ao0FekJFHAAAAD3RSTlMAqzXOZKDrEU5/ddyKgcO7y4dBAAAA70lEQVQ4jYWR0XaEIAxEsSqu3bYJEVL0/z+0QbdrQA/Mi8pcZgIac2oYewCw/fxh7jTCKXtFJgv89heiuQSsLC//AMnbUOQvUGrKCo7drGpg1MAM1wTSQC9zwZFxAvokQQBmoEQRLVIoH0MB7PZ7CibQJw1iEjBzFAVOUAEkO2yr37XGkICiIkTvMcmh85ssZBcRiLfDPuR9BKuPGcR3qOVDdteS75Jerjzdmv2KsOb7E/TQQPSlj/jUQDnBLn2KawO6rOP3JsB9NgD8bgHNhNYMaOqA6zLgJmBqAF+mAkjhj6kBiJ2pAw9TAZ5dZv8B/CIoPtddaqYAAAAASUVORK5CYII=';
class BizzyBotComponent {
    constructor(ngZone, host, http) {
        this.ngZone = ngZone;
        this.host = host;
        this.http = http;
        /** JSON string or object: merged over {@link BIZZY_BOT_DEFAULT_WIDGET_CONFIG} (see `bizzy-bot-default.config.json`). */
        this.config = null;
        /** Resolved after merge; used in template. */
        this.widgetConfig = BIZZY_BOT_DEFAULT_WIDGET_CONFIG;
        /** Feature toggles for toolbar / FAB (defaults from JSON). */
        this.ui = {
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
        this.isChatOpen = false;
        /** Shown in the header while the panel is open; updated via GET `BIZZY_BOT_FEEDBACK_PING_URL`. */
        this.backendConnectionStatus = 'offline';
        this.isDarkTheme = false;
        this.isTyping = false;
        this.isToolsOpen = false;
        /** Fixed position of the launcher + chat panel: `right` (default) or `left`. */
        this.chatDockSide = 'right';
        /** Which bot message index has the ⋮ actions menu open (null = closed). */
        this.openBubbleMenuIndex = null;
        this.isListening = false;
        this.voiceInputSupported = false;
        this.messageInput = '';
        this.uploadProgressTimers = [];
        /** Latest successful file upload (used as payslip on next `handleSendMessage`). */
        this.lastPayslipAttachment = null;
        /** Reject reads above this size (base64 ~33% larger in memory). */
        this.maxUploadBytes = 20 * 1024 * 1024;
        /** Finalized speech for the current mic session; applied to the input on stop. */
        this.speechSessionAccumulated = '';
        /** Bumped when the panel closes or a new ping starts so stale HTTP callbacks are ignored. */
        this.pingGeneration = 0;
        this.messages = [];
        this.voiceInputSupported = this.ensureSpeechRecognition();
    }
    ngOnInit() {
        this.applyWidgetConfig(true);
    }
    ngOnChanges(changes) {
        if (changes['config'] && !changes['config'].firstChange) {
            this.applyWidgetConfig(false);
        }
    }
    /** Brand + tagline + logos from merged config. */
    get brandIconSrc() {
        const u = this.widgetConfig.brandIconUrl?.trim();
        return u || DEFAULT_BRAND_ICON_SRC;
    }
    get fabLogoSrc() {
        return (this.widgetConfig.fabLogoUrl?.trim() ||
            BIZZY_BOT_DEFAULT_WIDGET_CONFIG.fabLogoUrl ||
            '');
    }
    /**
     * Apply default JSON + optional `config` input: theme CSS variables on host, copy, toggles.
     * @param initial when true, seeds the first bot message from `welcomeMessage`.
     */
    applyWidgetConfig(initial) {
        const patch = parseBizzyBotConfigInput(this.config);
        this.widgetConfig = mergeBizzyBotWidgetConfig(BIZZY_BOT_DEFAULT_WIDGET_CONFIG, patch ?? undefined);
        this.applyThemeToHost(this.widgetConfig.theme ?? {});
        this.syncUiFlags(this.widgetConfig.widgets);
        if (initial) {
            this.resetWelcomeMessage();
        }
    }
    syncUiFlags(widgets) {
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
    applyThemeToHost(theme) {
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
    resetWelcomeMessage() {
        const text = this.widgetConfig.welcomeMessage ?? BIZZY_BOT_DEFAULT_WIDGET_CONFIG.welcomeMessage ?? '';
        this.messages = [{ content: text, isUser: false, suppressBotBubbleActions: true }];
    }
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        if (!this.isChatOpen) {
            this.pingGeneration += 1;
            this.isToolsOpen = false;
            this.openBubbleMenuIndex = null;
        }
        else {
            this.runBackendPing();
        }
        setTimeout(() => this.scrollToBottom(), 0);
    }
    closeChat() {
        this.isChatOpen = false;
        this.pingGeneration += 1;
        this.isToolsOpen = false;
        this.openBubbleMenuIndex = null;
    }
    /** GET `/ping` when the chat panel opens (or after reload) for header online / offline. */
    runBackendPing() {
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
    getBearerAuthHttpHeaders() {
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
        }
        catch {
            /* storage blocked or unavailable */
        }
        return new HttpHeaders();
    }
    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
    }
    clearInput() {
        this.messageInput = '';
    }
    openTools() {
        this.isToolsOpen = !this.isToolsOpen;
    }
    toggleChatDockSide() {
        this.chatDockSide = this.chatDockSide === 'right' ? 'left' : 'right';
    }
    onDocumentClick(event) {
        const el = event.target;
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
    toggleBubbleMenu(index, event) {
        event.stopPropagation();
        this.openBubbleMenuIndex = this.openBubbleMenuIndex === index ? null : index;
    }
    closeBubbleMenu() {
        this.openBubbleMenuIndex = null;
    }
    setBotFeedback(index, value) {
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
        const query = msg.feedbackTurn?.query ?? this.inferFeedbackQueryFromPriorMessages(index);
        const response = msg.feedbackTurn?.response ?? this.botMessageFeedbackResponseText(msg);
        this.http
            .post(BIZZY_BOT_FEEDBACK_URL, {
            userId: Number.isFinite(uid) ? uid : 1,
            query,
            response,
            rating,
        }, { headers: this.getBearerAuthHttpHeaders() })
            .subscribe({
            next: () => { },
            error: () => { },
        });
    }
    async copyBotMessageFromMenu(message) {
        await this.copyBotMessage(message);
        this.closeBubbleMenu();
    }
    triggerFileUpload() {
        this.fileInputEl?.nativeElement.click();
    }
    handleFileSelect(event) {
        const input = event.target;
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
    fileUploadIconClass(message) {
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
    fileUploadKind(message) {
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
    addFileUploadMessage(file) {
        const msg = {
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
    encodeFileToBase64(file, messageIndex) {
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
                this.postAgentQuery(BIZZY_BOT_AGENT_UPLOAD_QUERY, mimeType, base64Payload, msg.fileUpload.fileName);
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
    convertFileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    resolve(result);
                }
                else {
                    reject(new Error('Unexpected read result'));
                }
            };
            reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    }
    /** Split `data:<mime>[;params];base64,<payload>` — MIME is the type before the first `;`. */
    static parseDataUrl(dataUrl) {
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
    clearUploadProgressTimers() {
        this.uploadProgressTimers.forEach((id) => clearTimeout(id));
        this.uploadProgressTimers = [];
    }
    /**
     * Cosmetic progress while `FileReader` runs; caps below 100% until `encodeFileToBase64` finishes.
     */
    runUploadProgressSimulation(messageIndex) {
        const totalMs = 1800;
        const steps = 36;
        const stepMs = Math.max(30, Math.floor(totalMs / steps));
        let step = 0;
        const maxSimulated = 92;
        const tick = () => {
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
    isAllowedUploadFile(file) {
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
    toggleVoiceInput() {
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
    messageLinkIntroVisible(message) {
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
        }
        catch {
            /* keep true below */
        }
        return true;
    }
    /** Hostname for link preview line. */
    linkMessageHost(message) {
        if (!message.linkUrl) {
            return '';
        }
        try {
            return new URL(message.linkUrl).hostname.replace(/^www\./, '');
        }
        catch {
            return message.linkUrl;
        }
    }
    async copyBotMessage(message) {
        const parts = [];
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
        }
        catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
            }
            finally {
                document.body.removeChild(textarea);
            }
        }
    }
    handleSendMessage() {
        const message = this.messageInput.trim();
        if (!message) {
            return;
        }
        const normalizedUrl = this.normalizeMessageAsLinkUrl(message);
        if (normalizedUrl) {
            this.messages.push({ content: message, isUser: true, linkUrl: normalizedUrl });
            this.scrollToBottom();
        }
        else {
            this.addMessage(message, true);
        }
        this.messageInput = '';
        this.fetchAgentReply(message);
    }
    reloadChat() {
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
    addMessage(content, isUser = false) {
        this.messages.push({ content, isUser });
        this.scrollToBottom();
    }
    /**
     * If the whole message is a single URL (or www… / domain-only), returns a normalized https URL.
     */
    normalizeMessageAsLinkUrl(raw) {
        const t = raw.trim();
        if (!t || /\s/.test(t)) {
            return null;
        }
        try {
            if (/^https?:\/\//i.test(t)) {
                return new URL(t).href;
            }
        }
        catch {
            return null;
        }
        if (/^www\./i.test(t)) {
            try {
                return new URL(`https://${t}`).href;
            }
            catch {
                return null;
            }
        }
        if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/[^\s]*)?$/i.test(t)) {
            try {
                return new URL(`https://${t}`).href;
            }
            catch {
                return null;
            }
        }
        return null;
    }
    fetchAgentReply(userQuery) {
        this.postAgentQuery(userQuery, this.lastPayslipAttachment?.mimeType ?? '', this.lastPayslipAttachment?.base64Payload ?? '');
    }
    /**
     * POST `/agent/query` with optional payslip payload (used after upload and on send).
     * @param feedbackFileLabel File name for feedback `query` when a payslip is attached.
     */
    postAgentQuery(query, payslipMimeType, payslipBase64, feedbackFileLabel) {
        if (this.botReplyTimer) {
            clearTimeout(this.botReplyTimer);
            this.botReplyTimer = undefined;
        }
        this.isTyping = true;
        this.scrollToBottom();
        const fileLabel = feedbackFileLabel ??
            (payslipBase64 ? this.findLatestCompletedUploadFileName() : undefined);
        const feedbackQuery = BizzyBotComponent.buildAgentFeedbackQueryLabel(query, payslipMimeType, payslipBase64, fileLabel);
        const body = {
            userId: BIZZY_BOT_AGENT_USER_ID,
            query,
            payslipMimeType,
            payslipBase64,
        };
        this.http
            .post(BIZZY_BOT_AGENT_QUERY_URL, body, {
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
    addBotAgentMessage(content, feedbackTurn) {
        this.messages.push({ content, isUser: false, feedbackTurn });
        this.scrollToBottom();
    }
    /** Human-readable `query` field for POST /feedback (user text + optional file line, no base64). */
    static buildAgentFeedbackQueryLabel(query, payslipMimeType, payslipBase64, fileDisplayName) {
        const parts = [];
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
    findLatestCompletedUploadFileName() {
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
    inferFeedbackQueryFromPriorMessages(botMessageIndex) {
        const parts = [];
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
    botMessageFeedbackResponseText(message) {
        const parts = [];
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
    extractAgentReplyText(body) {
        if (body == null) {
            return '';
        }
        if (typeof body === 'string') {
            return body;
        }
        if (typeof body !== 'object') {
            return String(body);
        }
        const o = body;
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
        }
        catch {
            return 'Received a response from the agent.';
        }
    }
    scrollToBottom() {
        const container = this.chatContainer?.nativeElement;
        if (!container) {
            return;
        }
        container.scrollTop = container.scrollHeight;
    }
    flushSpeechToInput() {
        const addition = this.speechSessionAccumulated.trim();
        this.speechSessionAccumulated = '';
        if (!addition) {
            return;
        }
        const cur = this.messageInput.trim();
        this.messageInput = cur ? `${cur} ${addition}` : addition;
    }
    ensureSpeechRecognition() {
        const win = window;
        const RecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
        if (!RecognitionCtor) {
            return false;
        }
        this.speechRecognition = new RecognitionCtor();
        this.speechRecognition.lang = 'en-US';
        this.speechRecognition.interimResults = false;
        this.speechRecognition.continuous = true;
        this.speechRecognition.onresult = (event) => {
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
    ngOnDestroy() {
        this.clearUploadProgressTimers();
        if (this.botReplyTimer) {
            clearTimeout(this.botReplyTimer);
        }
        this.speechRecognition?.stop();
    }
}
BizzyBotComponent.SESSION_ACCESS_TOKEN_KEY = 'access_token';
BizzyBotComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: BizzyBotComponent, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: i1.HttpClient }], target: i0.ɵɵFactoryTarget.Component });
BizzyBotComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.3.0", type: BizzyBotComponent, selector: "lib-bizzy-bot", inputs: { config: "config" }, host: { listeners: { "document:click": "onDocumentClick($event)" } }, viewQueries: [{ propertyName: "chatContainer", first: true, predicate: ["chatContainer"], descendants: true }, { propertyName: "fileInputEl", first: true, predicate: ["fileInputEl"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<button\n  *ngIf=\"ui.showLaunchButton\"\n  class=\"chat-fab btn btn-light px-4 py-3 shadow-sm\"\n  type=\"button\"\n  (click)=\"toggleChat()\"\n  [attr.aria-expanded]=\"isChatOpen\"\n  [attr.aria-label]=\"isChatOpen ? 'Close chat support' : 'Open chat support'\"\n  [class.chat-dock--left]=\"chatDockSide === 'left'\"\n>\n  <img class=\"chat-fab__logo\" [src]=\"fabLogoSrc\" [alt]=\"widgetConfig.brandName || 'Chat'\" />\n</button>\n\n<section\n  class=\"chat-panel card border-0 shadow-lg\"\n  *ngIf=\"isChatOpen\"\n  aria-label=\"Chat widget panel\"\n  [class.chat-dock--left]=\"chatDockSide === 'left'\"\n>\n  <div class=\"ai-chat\" [attr.data-theme]=\"isDarkTheme ? 'dark' : 'light'\">\n    <header class=\"header\">\n      <div class=\"header-title\">\n        <h1 class=\"brand-title\">\n          <img class=\"brand-title__icon\" [src]=\"brandIconSrc\" [alt]=\"widgetConfig.brandName || 'Assistant'\" />\n          <span class=\"brand-title__text\">\n            <span class=\"brand-title__name-row\">\n              <span class=\"brand-title__name\">{{ widgetConfig.brandName }}</span>\n              <span\n                class=\"brand-status\"\n                role=\"status\"\n                [ngClass]=\"{\n                  'brand-status--online': backendConnectionStatus === 'online',\n                  'brand-status--offline': backendConnectionStatus === 'offline',\n                  'brand-status--checking': backendConnectionStatus === 'checking'\n                }\"\n                [attr.aria-label]=\"\n                  backendConnectionStatus === 'checking'\n                    ? 'Checking connection'\n                    : backendConnectionStatus === 'online'\n                      ? 'Service online'\n                      : 'Service offline'\n                \"\n              >\n                <span class=\"brand-status__dot\" aria-hidden=\"true\"></span>\n              </span>\n            </span>\n            <span class=\"brand-title__tagline\">{{ widgetConfig.brandTagline }}</span>\n          </span>\n        </h1>\n      </div>\n      <div class=\"controls\">\n        <button\n          *ngIf=\"ui.showThemeToggle\"\n          class=\"theme-toggle\"\n          type=\"button\"\n          aria-label=\"Toggle theme\"\n          (click)=\"toggleTheme()\"\n        >\n          <i class=\"fa-solid\" [ngClass]=\"isDarkTheme ? 'fa-sun' : 'fa-moon'\"></i>\n        </button>\n        <button\n          *ngIf=\"ui.showReloadButton\"\n          class=\"theme-toggle reload-toggle\"\n          type=\"button\"\n          aria-label=\"Reload chat\"\n          (click)=\"reloadChat()\"\n        >\n          <i class=\"fa-solid fa-rotate-right\"></i>\n        </button>\n        <button\n          *ngIf=\"ui.showCloseButton\"\n          class=\"theme-toggle\"\n          type=\"button\"\n          (click)=\"closeChat()\"\n          aria-label=\"Close chat\"\n        >\n          <i class=\"fa-solid fa-xmark\"></i>\n        </button>\n      </div>\n    </header>\n\n    <div class=\"chat-container\" #chatContainer>\n      <div\n        class=\"message\"\n        *ngFor=\"let message of messages; let i = index\"\n        [ngClass]=\"message.isUser ? 'user-message' : 'bot-message'\"\n      >\n        <div class=\"avatar\">{{ message.isUser ? 'U' : 'B' }}</div>\n        <div class=\"message-content\">\n          <div\n            class=\"message-bubble\"\n            [class.message-bubble--file]=\"message.fileUpload\"\n            [class.message-bubble--link]=\"message.linkUrl && !message.fileUpload\"\n          >\n            <div\n              *ngIf=\"!message.isUser && ui.showBubbleMenu && !message.suppressBotBubbleActions\"\n              class=\"bubble-menu\"\n            >\n              <button\n                type=\"button\"\n                class=\"bubble-menu__trigger\"\n                aria-label=\"Message actions\"\n                title=\"More actions\"\n                [attr.aria-expanded]=\"openBubbleMenuIndex === i\"\n                (click)=\"toggleBubbleMenu(i, $event)\"\n              >\n                <i class=\"fa-solid fa-ellipsis-vertical\"></i>\n              </button>\n              <div class=\"bubble-menu__panel\" *ngIf=\"openBubbleMenuIndex === i\">\n                <div class=\"toolbar bubble-toolbar\" role=\"toolbar\" aria-label=\"Message actions\">\n                  <button\n                    class=\"toolbar__button\"\n                    type=\"button\"\n                    aria-label=\"Thumbs up\"\n                    title=\"Helpful\"\n                    [class.is-active-feedback]=\"message.feedback === 'up'\"\n                    (click)=\"setBotFeedback(i, 'up')\"\n                  >\n                    <i class=\"fa-thumbs-up toolbar__icon\" [ngClass]=\"message.feedback === 'up' ? 'fa-solid' : 'fa-regular'\"></i>\n                  </button>\n                  <button\n                    class=\"toolbar__button\"\n                    type=\"button\"\n                    aria-label=\"Thumbs down\"\n                    title=\"Not helpful\"\n                    [class.is-active-feedback]=\"message.feedback === 'down'\"\n                    (click)=\"setBotFeedback(i, 'down')\"\n                  >\n                    <i class=\"fa-thumbs-down toolbar__icon\" [ngClass]=\"message.feedback === 'down' ? 'fa-solid' : 'fa-regular'\"></i>\n                  </button>\n                </div>\n              </div>\n            </div>\n            <button\n              *ngIf=\"!message.isUser && ui.showCopyButton && !message.suppressBotBubbleActions\"\n              class=\"copy-message-btn\"\n              type=\"button\"\n              aria-label=\"Copy message\"\n              title=\"Copy\"\n              (click)=\"copyBotMessage(message)\"\n            >\n              <img\n                class=\"copy-message-btn__img\"\n                src=\"assets/copy-writing.png\"\n                width=\"12\"\n                height=\"12\"\n                alt=\"\"\n                decoding=\"async\"\n                aria-hidden=\"true\"\n              />\n            </button>\n            <ng-container *ngIf=\"message.fileUpload as fu\">\n              <div\n                class=\"file-upload-bubble\"\n                [ngClass]=\"'file-upload-bubble--' + fileUploadKind(message)\"\n                role=\"status\"\n                [attr.aria-label]=\"fu.state === 'uploading' ? 'Uploading ' + fu.fileName : fu.fileName\"\n              >\n                <span class=\"file-upload-bubble__eyebrow\">Attachment</span>\n                <div class=\"file-upload-bubble__row\">\n                  <span class=\"file-upload-bubble__icon\" aria-hidden=\"true\">\n                    <i class=\"fa-solid\" [ngClass]=\"fileUploadIconClass(message)\"></i>\n                  </span>\n                  <div class=\"file-upload-bubble__meta\">\n                    <span class=\"file-upload-bubble__name\" [title]=\"fu.fileName\">{{ fu.fileName }}</span>\n                    <span class=\"file-upload-bubble__hint\" *ngIf=\"fu.state === 'uploading'\">Sending securely\u2026</span>\n                  </div>\n                </div>\n                <div class=\"file-upload-bubble__progress-wrap\" *ngIf=\"fu.state === 'uploading'\">\n                  <div class=\"file-upload-bubble__progress-track\">\n                    <div class=\"file-upload-bubble__progress-bar\" [style.width.%]=\"fu.progress\"></div>\n                  </div>\n                  <span class=\"file-upload-bubble__pct\">{{ fu.progress }}%</span>\n                </div>\n                <div class=\"file-upload-bubble__done\" *ngIf=\"fu.state === 'done'\">\n                  <span class=\"file-upload-bubble__done-badge\">\n                    <i class=\"fa-solid fa-circle-check\" aria-hidden=\"true\"></i>\n                    <span>Uploaded</span>\n                  </span>\n                </div>\n                <div class=\"file-upload-bubble__error\" *ngIf=\"fu.state === 'error'\" role=\"alert\">\n                  <i class=\"fa-solid fa-circle-exclamation\" aria-hidden=\"true\"></i>\n                  <span>Upload failed \u2014 try again</span>\n                </div>\n              </div>\n            </ng-container>\n            <ng-container *ngIf=\"message.linkUrl && !message.fileUpload\">\n              <p class=\"link-message-bubble__intro\" *ngIf=\"messageLinkIntroVisible(message)\">{{ message.content }}</p>\n              <div\n                class=\"link-message-bubble\"\n                [ngClass]=\"message.isUser ? 'link-message-bubble--user' : 'link-message-bubble--bot'\"\n              >\n                <span class=\"link-message-bubble__eyebrow\">Link</span>\n                <a\n                  class=\"link-message-bubble__card\"\n                  [href]=\"message.linkUrl\"\n                  target=\"_blank\"\n                  rel=\"noopener noreferrer\"\n                >\n                  <span class=\"link-message-bubble__icon\" aria-hidden=\"true\">\n                    <i class=\"fa-solid fa-link\"></i>\n                  </span>\n                  <span class=\"link-message-bubble__body\">\n                    <span class=\"link-message-bubble__title\" *ngIf=\"message.linkTitle\">{{ message.linkTitle }}</span>\n                    <span class=\"link-message-bubble__host\">{{ linkMessageHost(message) }}</span>\n                    <span class=\"link-message-bubble__url\" [title]=\"message.linkUrl\">{{ message.linkUrl }}</span>\n                  </span>\n                  <span class=\"link-message-bubble__open\" aria-hidden=\"true\">\n                    <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>\n                  </span>\n                </a>\n              </div>\n            </ng-container>\n            <span\n              class=\"message-bubble__text\"\n              *ngIf=\"message.content?.trim() && !message.fileUpload && !message.linkUrl\"\n              >{{ message.content }}</span\n            >\n          </div>\n        </div>\n      </div>\n\n      <div class=\"typing-indicator\" [class.show]=\"isTyping\">\n        <div class=\"typing-dots\">\n          <div class=\"typing-dot\"></div>\n          <div class=\"typing-dot\"></div>\n          <div class=\"typing-dot\"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"input-container\">\n      <div class=\"input-wrapper\">\n        <input\n          type=\"text\"\n          class=\"message-input\"\n          placeholder=\"Type your message...\"\n          aria-label=\"Message input\"\n          [(ngModel)]=\"messageInput\"\n          (keydown.enter)=\"handleSendMessage()\"\n        />\n        <div class=\"action-buttons\">\n          <button\n            *ngIf=\"ui.showClearInputButton\"\n            class=\"action-button\"\n            type=\"button\"\n            [disabled]=\"!messageInput.trim()\"\n            aria-label=\"Clear input\"\n            title=\"Clear input\"\n            (click)=\"clearInput()\"\n          >\n            <i class=\"fa-solid fa-xmark\"></i>\n          </button>\n          <button\n            *ngIf=\"ui.showToolsMenu\"\n            class=\"action-button tools-menu-trigger\"\n            type=\"button\"\n            aria-label=\"Tools\"\n            title=\"Tools\"\n            (click)=\"openTools()\"\n          >\n            <i class=\"fa-solid fa-sliders\"></i>\n          </button>\n          <button class=\"send-button\" type=\"button\" (click)=\"handleSendMessage()\">\n            <i class=\"fas fa-paper-plane\"></i>\n          </button>\n        </div>\n      </div>\n\n      <div class=\"tools-panel\" *ngIf=\"isToolsOpen && ui.showToolsMenu\">\n        <div id=\"root\">\n          <div class=\"tools-root-main\">\n            <div class=\"toolbar\" role=\"toolbar\" aria-label=\"Tools\">\n              <button\n                *ngIf=\"ui.showFileUpload\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                aria-label=\"Upload file\"\n                title=\"Upload file\"\n                (click)=\"triggerFileUpload()\"\n              >\n                <i class=\"fa-solid fa-paperclip toolbar__icon\"></i>\n              </button>\n\n              <button\n                *ngIf=\"ui.showVoiceInput\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                [class.is-listening]=\"isListening\"\n                aria-label=\"Speech to text\"\n                title=\"Speech to text\"\n                (click)=\"toggleVoiceInput()\"\n              >\n                <i class=\"fa-solid toolbar__icon\" [ngClass]=\"isListening ? 'fa-wave-square' : 'fa-microphone'\"></i>\n              </button>\n\n              <button\n                *ngIf=\"ui.showDockSideToggle\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                [attr.aria-label]=\"chatDockSide === 'right' ? 'Move chat to the left' : 'Move chat to the right'\"\n                [attr.title]=\"chatDockSide === 'right' ? 'Dock chat left' : 'Dock chat right'\"\n                (click)=\"toggleChatDockSide()\"\n              >\n                <i\n                  class=\"fa-solid toolbar__icon\"\n                  [ngClass]=\"chatDockSide === 'right' ? 'fa-arrow-left-long' : 'fa-arrow-right-long'\"\n                  aria-hidden=\"true\"\n                ></i>\n              </button>\n            </div>\n            <input\n              #fileInputEl\n              type=\"file\"\n              hidden\n              accept=\".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.csv,.xls,.xlsx,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\"\n              (change)=\"handleFileSelect($event)\"\n            />\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>\n", styles: [":host{--chat-brand: #0e7d3f;--chat-brand-dark: #0a5c2e;--primary-gradient: linear-gradient(135deg, #0e7d3f, #13a354);--secondary-gradient: linear-gradient(135deg, #0b6532, #0e7d3f);--bg-color: #ffffff;--chat-bg: #f8fafc;--text-primary: #1e293b;--text-secondary: #64748b;--bot-message-bg: #f1f5f9;--user-message-bg: var(--chat-brand);--border-color: #e2e8f0;--shadow-sm: 0 1px 2px rgba(0, 0, 0, .05);--shadow-md: 0 4px 6px rgba(0, 0, 0, .1);--shadow-lg: 0 10px 15px rgba(0, 0, 0, .1);--message-bubble-max-width: 21rem}.chat-fab{position:fixed;right:24px;bottom:24px;z-index:10000;border-radius:.375rem;transition:transform .2s ease,box-shadow .2s ease,left .25s ease,right .25s ease}.chat-fab.btn-light{background:#ffffff;border:1px solid #d9e3ef}.chat-fab__logo{display:block;width:112px;height:22px;object-fit:contain}.chat-fab:hover{transform:translateY(-2px)}.chat-fab.chat-dock--left{right:auto;left:24px}.chat-panel{position:fixed;right:24px;bottom:84px;width:min(390px,100vw - 24px);height:min(640px,100vh - 110px);z-index:9999;border-radius:.375rem;overflow:hidden;transition:left .25s ease,right .25s ease}.chat-panel.chat-dock--left{right:auto;left:24px}.chat-panel:before{content:\"\";position:absolute;inset:0;background-image:url(https://cdn.biz2credit.com/templates/biz2creditmain2020/images/Biz2credit-logo.svg);background-repeat:no-repeat;background-position:center 55%;background-size:72% auto;opacity:.06;pointer-events:none;z-index:0}.chat-panel>*{position:relative;z-index:1}.ai-chat{height:100%;display:flex;flex-direction:column;background-color:var(--bg-color);color:var(--text-primary);transition:all .3s ease}.ai-chat[data-theme=dark]{--bg-color: #0f172a;--chat-bg: #1e293b;--text-primary: #f1f5f9;--text-secondary: #94a3b8;--bot-message-bg: #334155;--user-message-bg: var(--chat-brand);--border-color: #334155}.header{display:flex;justify-content:space-between;align-items:center;padding:1rem;background-color:#ffffffd9;border-bottom:1px solid var(--border-color);box-shadow:var(--shadow-sm);backdrop-filter:blur(6px)}.ai-chat[data-theme=dark] .header{background-color:#0f172ae0}.header-title{display:flex;align-items:center;min-width:0;flex:1}.header-title h1{font-size:1.1rem;font-weight:600;margin:0;min-width:0}.brand-title__name-row{display:inline-flex;align-items:center;gap:.45rem;flex-wrap:wrap;min-width:0}.brand-status{display:inline-flex;align-items:center;flex-shrink:0}.brand-status__dot{width:9px;height:9px;border-radius:50%;background:#94a3b8}.brand-status--checking .brand-status__dot{animation:status-glow-neutral 1.4s ease-in-out infinite}.brand-status--online .brand-status__dot{background:#10b981;animation:status-glow-green 2.2s ease-in-out infinite}.brand-status--offline .brand-status__dot{background:#ef4444;animation:status-glow-red 2.2s ease-in-out infinite}.ai-chat[data-theme=dark] .brand-status--online .brand-status__dot{background:#34d399}.ai-chat[data-theme=dark] .brand-status--offline .brand-status__dot{background:#f87171}@keyframes status-glow-green{0%,to{box-shadow:0 0 2px #10b98159,0 0 5px 1px #10b98124}50%{box-shadow:0 0 3px 1px #10b98173,0 0 8px 2px #10b98133}}@keyframes status-glow-red{0%,to{box-shadow:0 0 2px #ef444452,0 0 5px 1px #ef444421}50%{box-shadow:0 0 3px 1px #ef44446b,0 0 8px 2px #ef44442e}}@keyframes status-glow-neutral{0%,to{opacity:.72;box-shadow:0 0 3px #94a3b833}50%{opacity:1;box-shadow:0 0 5px 1px #94a3b847}}.brand-title{display:inline-flex;align-items:center;gap:.65rem;margin:0}.brand-title__icon{width:24px;height:24px;display:block;flex-shrink:0}.brand-title__text{display:inline-flex;flex-direction:column;line-height:1.05}.brand-title__name{font-size:1.12rem;font-weight:600;text-transform:uppercase;color:color-mix(in srgb,var(--chat-brand) 82%,#0f172a)}.brand-title__tagline{font-size:.52rem;font-weight:500;color:var(--text-secondary);margin-top:.18rem;text-transform:uppercase}.ai-chat[data-theme=dark] .brand-title__name{color:color-mix(in srgb,#ffffff 88%,var(--chat-brand))}.bot-status{display:flex;align-items:center;gap:.45rem;font-size:.78rem;color:var(--text-secondary)}.status-indicator{width:8px;height:8px;background:#10b981;border-radius:50%;animation:pulse 2s infinite}@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:.7}to{transform:scale(1);opacity:1}}.controls{display:flex;gap:.5rem;align-items:center}.theme-toggle{background-color:var(--bot-message-bg);border:none;cursor:pointer;color:var(--text-primary);font-size:1rem;width:34px;height:34px;border-radius:.375rem;transition:all .2s ease}.theme-toggle:hover{background-color:var(--bot-message-bg)}.reload-toggle:hover i{transform:rotate(180deg);transition:transform .25s ease}.chat-container{flex:1;overflow-y:auto;padding:1rem;background-color:color-mix(in srgb,var(--chat-bg) 88%,transparent);scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--text-secondary) 45%,transparent) transparent}.chat-container::-webkit-scrollbar{width:1px}.chat-container::-webkit-scrollbar-track{background:transparent}.chat-container::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--text-secondary) 45%,transparent);border-radius:999px}.chat-container::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--text-secondary) 65%,transparent)}.message{display:flex;align-items:flex-start;margin-bottom:1rem;opacity:0;transform:translateY(20px);animation:messageAppear .35s ease forwards}@keyframes messageAppear{to{opacity:1;transform:translateY(0)}}.avatar{width:34px;height:34px;border-radius:10px;margin-right:.65rem;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:.78rem;box-shadow:var(--shadow-md);flex-shrink:0}.user-message .avatar{background:var(--secondary-gradient)}.message-bubble{width:fit-content;max-width:min(100%,var(--message-bubble-max-width));box-sizing:border-box;padding:.85rem 1rem;border-radius:.375rem;box-shadow:var(--shadow-sm);line-height:1.5;font-size:.9rem;position:relative}.message-content{display:inline-flex;flex-direction:column;align-items:flex-start;gap:.35rem;min-width:0}.user-message .message-content{align-items:flex-end}.bot-message .message-bubble{background-color:var(--bot-message-bg);border-top-left-radius:0;padding-top:.45rem;padding-right:2.5rem;padding-bottom:1.85rem}.bubble-menu{position:absolute;top:.25rem;right:.25rem;z-index:4}.bubble-menu__trigger{width:30px;height:30px;padding:0;border:none;border-radius:.375rem;background:transparent;color:var(--text-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:.95rem;transition:background-color .15s ease,color .15s ease}.bubble-menu__trigger:hover{color:var(--text-primary);background-color:color-mix(in srgb,var(--text-secondary) 14%,transparent)}.bubble-menu__trigger[aria-expanded=true]{color:var(--text-primary);background-color:color-mix(in srgb,var(--text-secondary) 18%,transparent)}.bubble-menu__panel{position:absolute;top:calc(100% + .35rem);right:0;z-index:12;margin:0;pointer-events:auto;animation:bubbleMenuIn .18s ease-out}.bubble-toolbar.toolbar{box-shadow:0 8px 20px #0000002e;padding:.15rem;gap:.12rem}.bubble-toolbar.toolbar .toolbar__button{width:24px;height:24px;min-width:24px;min-height:24px}.bubble-toolbar.toolbar .toolbar__icon{font-size:.65rem;width:1em;height:1em}.toolbar__button.is-active-feedback{background-color:#ffffff42}.copy-message-btn{position:absolute;bottom:.35rem;right:.35rem;z-index:3;border:none;background-color:color-mix(in srgb,var(--text-secondary) 12%,transparent);color:var(--text-secondary);font-size:.82rem;width:28px;height:28px;padding:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border-radius:.35rem;transition:color .15s ease,background-color .15s ease,transform .1s ease,box-shadow .1s ease;-webkit-tap-highlight-color:transparent}.copy-message-btn:hover{color:var(--text-primary)}.copy-message-btn:active{transform:scale(.88);color:var(--chat-brand);background-color:color-mix(in srgb,var(--chat-brand) 18%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--chat-brand) 28%,transparent)}.copy-message-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--chat-brand) 55%,transparent);outline-offset:2px}.copy-message-btn__img{display:block;width:18px;height:18px;object-fit:contain;flex-shrink:0;pointer-events:none}.ai-chat[data-theme=dark] .copy-message-btn__img{filter:invert(1) brightness(1.05)}@keyframes bubbleMenuIn{0%{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.user-message{flex-direction:row-reverse}.user-message .avatar{margin-right:0;margin-left:.65rem}.user-message .message-bubble{background:var(--user-message-bg);color:#fff;border-top-right-radius:0}.bot-message .message-bubble.message-bubble--link{padding-top:.45rem;padding-right:2.5rem;padding-bottom:1.85rem}.link-message-bubble__intro{margin:0 0 .5rem;font-size:.88rem;line-height:1.45;color:inherit}.user-message .link-message-bubble__intro{color:#ffffffeb}.link-message-bubble{display:flex;flex-direction:column;gap:.4rem;width:fit-content;max-width:100%;min-width:0}.link-message-bubble__eyebrow{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85}.user-message .link-message-bubble__eyebrow{color:#ffffffbf}.bot-message .link-message-bubble__eyebrow{color:var(--text-secondary)}.link-message-bubble__card{display:flex;align-items:flex-start;gap:.65rem;padding:.7rem .75rem;border-radius:.5rem;text-decoration:none;max-width:100%;min-width:0;box-sizing:border-box;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.link-message-bubble--user .link-message-bubble__card{background:linear-gradient(165deg,rgba(255,255,255,.99) 0%,rgba(248,250,252,.98) 100%);color:#0f172a;border:1px solid rgba(255,255,255,.65);box-shadow:0 1px #ffffffd9 inset,0 6px 18px #0f172a1f}.link-message-bubble--user .link-message-bubble__card:hover{border-color:color-mix(in srgb,var(--chat-brand) 35%,#ffffff);box-shadow:0 1px #ffffffe6 inset,0 8px 22px #0f172a24}.link-message-bubble--bot .link-message-bubble__card{background:var(--bg-color);color:var(--text-primary);border:1px solid var(--border-color);box-shadow:var(--shadow-sm)}.link-message-bubble--bot .link-message-bubble__card:hover{border-color:color-mix(in srgb,var(--chat-brand) 28%,var(--border-color));box-shadow:var(--shadow-md)}.link-message-bubble__card:active{transform:scale(.99)}.link-message-bubble__icon{width:2.2rem;height:2.2rem;border-radius:.4rem;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}.link-message-bubble--user .link-message-bubble__icon{background:color-mix(in srgb,var(--chat-brand) 14%,#ffffff);color:var(--chat-brand-dark)}.link-message-bubble--bot .link-message-bubble__icon{background:color-mix(in srgb,var(--chat-brand) 12%,var(--bot-message-bg));color:var(--chat-brand)}.link-message-bubble__body{min-width:0;flex:1;display:flex;flex-direction:column;gap:.15rem}.link-message-bubble__title{font-size:.82rem;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.link-message-bubble__host{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}.link-message-bubble--user .link-message-bubble__host{color:#64748b}.link-message-bubble--bot .link-message-bubble__host{color:var(--text-secondary)}.link-message-bubble__url{font-size:.72rem;color:#64748b;word-break:break-all;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.link-message-bubble--bot .link-message-bubble__url{color:var(--text-secondary)}.link-message-bubble__open{flex-shrink:0;font-size:.78rem;opacity:.55;margin-top:.15rem}.link-message-bubble__card:hover .link-message-bubble__open{opacity:.9;color:var(--chat-brand)}.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__card{background:linear-gradient(165deg,rgba(30,41,59,.98) 0%,rgba(15,23,42,.99) 100%);color:#f1f5f9;border-color:#94a3b840}.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__url,.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__host{color:#94a3b8}.file-upload-bubble{display:flex;flex-direction:column;gap:.55rem;padding:.75rem .85rem .8rem;border-radius:.5rem;background:linear-gradient(165deg,rgba(255,255,255,.99) 0%,rgba(248,250,252,.98) 100%);color:#0f172a;box-shadow:0 1px #ffffffd9 inset,0 6px 20px #0f172a1f;border:1px solid rgba(255,255,255,.65)}.file-upload-bubble__eyebrow{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;line-height:1}.file-upload-bubble__row{display:flex;align-items:flex-start;gap:.65rem}.file-upload-bubble__icon{width:2.45rem;height:2.45rem;border-radius:.45rem;display:flex;align-items:center;justify-content:center;font-size:1.08rem;flex-shrink:0;background:color-mix(in srgb,var(--chat-brand) 14%,#ffffff);color:var(--chat-brand-dark)}.file-upload-bubble--pdf .file-upload-bubble__icon{background:color-mix(in srgb,#ef4444 16%,#ffffff);color:#b91c1c}.file-upload-bubble--image .file-upload-bubble__icon{background:color-mix(in srgb,#3b82f6 16%,#ffffff);color:#1d4ed8}.file-upload-bubble--csv .file-upload-bubble__icon{background:color-mix(in srgb,#64748b 14%,#ffffff);color:#475569}.file-upload-bubble--excel .file-upload-bubble__icon{background:color-mix(in srgb,#16a34a 16%,#ffffff);color:#15803d}.file-upload-bubble__meta{min-width:0;flex:1;display:flex;flex-direction:column;gap:.2rem}.file-upload-bubble__name{font-size:.84rem;font-weight:600;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}.file-upload-bubble__hint{font-size:.68rem;color:#64748b;font-weight:500}.file-upload-bubble__progress-wrap{display:flex;align-items:center;gap:.5rem}.file-upload-bubble__progress-track{flex:1;height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;box-shadow:0 1px 2px #0f172a0f inset}.file-upload-bubble__progress-bar{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--chat-brand-dark),var(--chat-brand));transition:width .14s ease-out;box-shadow:0 0 12px color-mix(in srgb,var(--chat-brand) 45%,transparent)}.file-upload-bubble__pct{font-size:.68rem;font-weight:700;font-variant-numeric:tabular-nums;color:#475569;min-width:2.35rem;text-align:right}.file-upload-bubble__done{margin-top:-.15rem}.file-upload-bubble__done-badge{display:inline-flex;align-items:center;gap:.35rem;font-size:.74rem;font-weight:700;color:#15803d;padding:.25rem .45rem .25rem .35rem;border-radius:.35rem;background:color-mix(in srgb,#22c55e 12%,#ffffff)}.file-upload-bubble__done-badge i{font-size:.85rem;color:#16a34a}.file-upload-bubble__error{display:flex;align-items:center;gap:.4rem;font-size:.74rem;font-weight:600;color:#b91c1c;padding:.35rem .45rem;border-radius:.35rem;background:color-mix(in srgb,#ef4444 10%,#ffffff)}.ai-chat[data-theme=dark] .file-upload-bubble{background:linear-gradient(165deg,rgba(30,41,59,.98) 0%,rgba(15,23,42,.99) 100%);color:#f1f5f9;border-color:#94a3b840;box-shadow:0 1px #ffffff0f inset,0 8px 24px #00000059}.ai-chat[data-theme=dark] .file-upload-bubble__eyebrow{color:#94a3b8}.ai-chat[data-theme=dark] .file-upload-bubble__name{color:#f8fafc}.ai-chat[data-theme=dark] .file-upload-bubble__hint{color:#94a3b8}.ai-chat[data-theme=dark] .file-upload-bubble__progress-track{background:#334155;box-shadow:0 1px 2px #00000040 inset}.ai-chat[data-theme=dark] .file-upload-bubble__pct{color:#cbd5e1}.ai-chat[data-theme=dark] .file-upload-bubble__done-badge{background:color-mix(in srgb,#22c55e 18%,#1e293b);color:#86efac}.ai-chat[data-theme=dark] .file-upload-bubble__done-badge i{color:#4ade80}.ai-chat[data-theme=dark] .file-upload-bubble__error{background:color-mix(in srgb,#ef4444 15%,#1e293b);color:#fca5a5}.typing-indicator{display:none;padding:.8rem 1rem;background-color:var(--bot-message-bg);border-radius:.9rem;width:fit-content;margin-left:2.6rem;box-shadow:var(--shadow-sm)}.typing-indicator.show{display:block}.typing-dots{display:flex;gap:.35rem}.typing-dot{width:7px;height:7px;background-color:var(--text-secondary);border-radius:50%;animation:typingBounce 1.4s infinite ease-in-out}.typing-dot:nth-child(1){animation-delay:-.32s}.typing-dot:nth-child(2){animation-delay:-.16s}@keyframes typingBounce{0%,80%,to{transform:scale(0)}40%{transform:scale(1)}}.input-container{padding:.9rem;background-color:color-mix(in srgb,var(--bg-color) 95%,transparent);border-top:1px solid var(--border-color);box-shadow:var(--shadow-lg);backdrop-filter:blur(6px);position:relative;overflow:visible}.input-wrapper{display:flex;gap:.55rem;background-color:var(--chat-bg);border-radius:.85rem;padding:.4rem .6rem;box-shadow:var(--shadow-sm)}.message-input{flex:1;padding:.7rem .8rem;border:none;background:none;color:var(--text-primary);font-size:.93rem}.message-input:focus{outline:none}.message-input::placeholder{color:var(--text-secondary)}.action-buttons{display:flex;gap:.35rem;align-items:center}.action-button{background:none;border:none;width:34px;height:34px;color:var(--text-secondary);cursor:pointer;border-radius:.5rem;transition:all .2s ease}.action-button:hover{background-color:var(--bot-message-bg);color:var(--text-primary)}.send-button{background:var(--primary-gradient);color:#fff;border:none;padding:.65rem .95rem;border-radius:.5rem;cursor:pointer;transition:all .2s ease;font-weight:500;display:flex;align-items:center;gap:.45rem;font-size:.85rem}.send-button:hover{opacity:.93;transform:translateY(-1px)}.tools-panel{position:absolute;right:.9rem;bottom:calc(100% + .45rem);z-index:20;margin:0;pointer-events:auto;animation:toolsPopoverIn .18s ease-out}#root{width:auto}.tools-root-main{display:flex;justify-content:flex-end}.toolbar{background-color:var(--chat-brand);border-radius:.375rem;display:inline-flex;gap:.25rem;align-items:center;position:relative;padding:.25rem;min-width:2em;height:auto;box-shadow:0 8px 20px #0000002e}@keyframes toolsPopoverIn{0%{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.toolbar__button{background-color:#80808000;border:0;padding:0;border-radius:.375rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative;width:34px;height:34px;min-width:34px;min-height:34px;z-index:2}.toolbar__button[aria-pressed=false]:hover,.toolbar__button:hover{background-color:#ffffff2e}.toolbar__button.is-listening{background-color:#ffffff42}.toolbar__button-tip{background-color:var(--chat-brand-dark);border-radius:.5625rem;color:#fff;font-size:.625em;line-height:1;margin-top:.375rem;opacity:0;padding:.25rem .5rem;pointer-events:none;position:absolute;top:100%;left:50%;transform:translate(-50%,-25%);transition:opacity .2s ease,transform .2s ease,visibility .2s ease;visibility:hidden;white-space:nowrap}.toolbar__button:focus-visible .toolbar__button-tip,.toolbar__button:hover .toolbar__button-tip{opacity:1;visibility:visible;transform:translate(-50%)}.toolbar__highlight{background-color:#fff;border-radius:.875em;margin:.125em;pointer-events:none;position:absolute;top:0;width:1.75em;height:1.75em;transition:left .3s cubic-bezier(.65,0,.35,1);z-index:1}.toolbar__icon{color:#fff;display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;line-height:1;font-size:.85rem}@media (max-width: 420px){.chat-panel{right:12px;bottom:74px;width:calc(100vw - 24px);height:min(640px,100vh - 88px)}.chat-panel.chat-dock--left{right:auto;left:12px}.chat-fab{right:12px;bottom:12px}.chat-fab.chat-dock--left{right:auto;left:12px}.message-bubble{max-width:min(84%,var(--message-bubble-max-width))}}\n"], dependencies: [{ kind: "directive", type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i3.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { kind: "directive", type: i3.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i3.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: BizzyBotComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-bizzy-bot', template: "<button\n  *ngIf=\"ui.showLaunchButton\"\n  class=\"chat-fab btn btn-light px-4 py-3 shadow-sm\"\n  type=\"button\"\n  (click)=\"toggleChat()\"\n  [attr.aria-expanded]=\"isChatOpen\"\n  [attr.aria-label]=\"isChatOpen ? 'Close chat support' : 'Open chat support'\"\n  [class.chat-dock--left]=\"chatDockSide === 'left'\"\n>\n  <img class=\"chat-fab__logo\" [src]=\"fabLogoSrc\" [alt]=\"widgetConfig.brandName || 'Chat'\" />\n</button>\n\n<section\n  class=\"chat-panel card border-0 shadow-lg\"\n  *ngIf=\"isChatOpen\"\n  aria-label=\"Chat widget panel\"\n  [class.chat-dock--left]=\"chatDockSide === 'left'\"\n>\n  <div class=\"ai-chat\" [attr.data-theme]=\"isDarkTheme ? 'dark' : 'light'\">\n    <header class=\"header\">\n      <div class=\"header-title\">\n        <h1 class=\"brand-title\">\n          <img class=\"brand-title__icon\" [src]=\"brandIconSrc\" [alt]=\"widgetConfig.brandName || 'Assistant'\" />\n          <span class=\"brand-title__text\">\n            <span class=\"brand-title__name-row\">\n              <span class=\"brand-title__name\">{{ widgetConfig.brandName }}</span>\n              <span\n                class=\"brand-status\"\n                role=\"status\"\n                [ngClass]=\"{\n                  'brand-status--online': backendConnectionStatus === 'online',\n                  'brand-status--offline': backendConnectionStatus === 'offline',\n                  'brand-status--checking': backendConnectionStatus === 'checking'\n                }\"\n                [attr.aria-label]=\"\n                  backendConnectionStatus === 'checking'\n                    ? 'Checking connection'\n                    : backendConnectionStatus === 'online'\n                      ? 'Service online'\n                      : 'Service offline'\n                \"\n              >\n                <span class=\"brand-status__dot\" aria-hidden=\"true\"></span>\n              </span>\n            </span>\n            <span class=\"brand-title__tagline\">{{ widgetConfig.brandTagline }}</span>\n          </span>\n        </h1>\n      </div>\n      <div class=\"controls\">\n        <button\n          *ngIf=\"ui.showThemeToggle\"\n          class=\"theme-toggle\"\n          type=\"button\"\n          aria-label=\"Toggle theme\"\n          (click)=\"toggleTheme()\"\n        >\n          <i class=\"fa-solid\" [ngClass]=\"isDarkTheme ? 'fa-sun' : 'fa-moon'\"></i>\n        </button>\n        <button\n          *ngIf=\"ui.showReloadButton\"\n          class=\"theme-toggle reload-toggle\"\n          type=\"button\"\n          aria-label=\"Reload chat\"\n          (click)=\"reloadChat()\"\n        >\n          <i class=\"fa-solid fa-rotate-right\"></i>\n        </button>\n        <button\n          *ngIf=\"ui.showCloseButton\"\n          class=\"theme-toggle\"\n          type=\"button\"\n          (click)=\"closeChat()\"\n          aria-label=\"Close chat\"\n        >\n          <i class=\"fa-solid fa-xmark\"></i>\n        </button>\n      </div>\n    </header>\n\n    <div class=\"chat-container\" #chatContainer>\n      <div\n        class=\"message\"\n        *ngFor=\"let message of messages; let i = index\"\n        [ngClass]=\"message.isUser ? 'user-message' : 'bot-message'\"\n      >\n        <div class=\"avatar\">{{ message.isUser ? 'U' : 'B' }}</div>\n        <div class=\"message-content\">\n          <div\n            class=\"message-bubble\"\n            [class.message-bubble--file]=\"message.fileUpload\"\n            [class.message-bubble--link]=\"message.linkUrl && !message.fileUpload\"\n          >\n            <div\n              *ngIf=\"!message.isUser && ui.showBubbleMenu && !message.suppressBotBubbleActions\"\n              class=\"bubble-menu\"\n            >\n              <button\n                type=\"button\"\n                class=\"bubble-menu__trigger\"\n                aria-label=\"Message actions\"\n                title=\"More actions\"\n                [attr.aria-expanded]=\"openBubbleMenuIndex === i\"\n                (click)=\"toggleBubbleMenu(i, $event)\"\n              >\n                <i class=\"fa-solid fa-ellipsis-vertical\"></i>\n              </button>\n              <div class=\"bubble-menu__panel\" *ngIf=\"openBubbleMenuIndex === i\">\n                <div class=\"toolbar bubble-toolbar\" role=\"toolbar\" aria-label=\"Message actions\">\n                  <button\n                    class=\"toolbar__button\"\n                    type=\"button\"\n                    aria-label=\"Thumbs up\"\n                    title=\"Helpful\"\n                    [class.is-active-feedback]=\"message.feedback === 'up'\"\n                    (click)=\"setBotFeedback(i, 'up')\"\n                  >\n                    <i class=\"fa-thumbs-up toolbar__icon\" [ngClass]=\"message.feedback === 'up' ? 'fa-solid' : 'fa-regular'\"></i>\n                  </button>\n                  <button\n                    class=\"toolbar__button\"\n                    type=\"button\"\n                    aria-label=\"Thumbs down\"\n                    title=\"Not helpful\"\n                    [class.is-active-feedback]=\"message.feedback === 'down'\"\n                    (click)=\"setBotFeedback(i, 'down')\"\n                  >\n                    <i class=\"fa-thumbs-down toolbar__icon\" [ngClass]=\"message.feedback === 'down' ? 'fa-solid' : 'fa-regular'\"></i>\n                  </button>\n                </div>\n              </div>\n            </div>\n            <button\n              *ngIf=\"!message.isUser && ui.showCopyButton && !message.suppressBotBubbleActions\"\n              class=\"copy-message-btn\"\n              type=\"button\"\n              aria-label=\"Copy message\"\n              title=\"Copy\"\n              (click)=\"copyBotMessage(message)\"\n            >\n              <img\n                class=\"copy-message-btn__img\"\n                src=\"assets/copy-writing.png\"\n                width=\"12\"\n                height=\"12\"\n                alt=\"\"\n                decoding=\"async\"\n                aria-hidden=\"true\"\n              />\n            </button>\n            <ng-container *ngIf=\"message.fileUpload as fu\">\n              <div\n                class=\"file-upload-bubble\"\n                [ngClass]=\"'file-upload-bubble--' + fileUploadKind(message)\"\n                role=\"status\"\n                [attr.aria-label]=\"fu.state === 'uploading' ? 'Uploading ' + fu.fileName : fu.fileName\"\n              >\n                <span class=\"file-upload-bubble__eyebrow\">Attachment</span>\n                <div class=\"file-upload-bubble__row\">\n                  <span class=\"file-upload-bubble__icon\" aria-hidden=\"true\">\n                    <i class=\"fa-solid\" [ngClass]=\"fileUploadIconClass(message)\"></i>\n                  </span>\n                  <div class=\"file-upload-bubble__meta\">\n                    <span class=\"file-upload-bubble__name\" [title]=\"fu.fileName\">{{ fu.fileName }}</span>\n                    <span class=\"file-upload-bubble__hint\" *ngIf=\"fu.state === 'uploading'\">Sending securely\u2026</span>\n                  </div>\n                </div>\n                <div class=\"file-upload-bubble__progress-wrap\" *ngIf=\"fu.state === 'uploading'\">\n                  <div class=\"file-upload-bubble__progress-track\">\n                    <div class=\"file-upload-bubble__progress-bar\" [style.width.%]=\"fu.progress\"></div>\n                  </div>\n                  <span class=\"file-upload-bubble__pct\">{{ fu.progress }}%</span>\n                </div>\n                <div class=\"file-upload-bubble__done\" *ngIf=\"fu.state === 'done'\">\n                  <span class=\"file-upload-bubble__done-badge\">\n                    <i class=\"fa-solid fa-circle-check\" aria-hidden=\"true\"></i>\n                    <span>Uploaded</span>\n                  </span>\n                </div>\n                <div class=\"file-upload-bubble__error\" *ngIf=\"fu.state === 'error'\" role=\"alert\">\n                  <i class=\"fa-solid fa-circle-exclamation\" aria-hidden=\"true\"></i>\n                  <span>Upload failed \u2014 try again</span>\n                </div>\n              </div>\n            </ng-container>\n            <ng-container *ngIf=\"message.linkUrl && !message.fileUpload\">\n              <p class=\"link-message-bubble__intro\" *ngIf=\"messageLinkIntroVisible(message)\">{{ message.content }}</p>\n              <div\n                class=\"link-message-bubble\"\n                [ngClass]=\"message.isUser ? 'link-message-bubble--user' : 'link-message-bubble--bot'\"\n              >\n                <span class=\"link-message-bubble__eyebrow\">Link</span>\n                <a\n                  class=\"link-message-bubble__card\"\n                  [href]=\"message.linkUrl\"\n                  target=\"_blank\"\n                  rel=\"noopener noreferrer\"\n                >\n                  <span class=\"link-message-bubble__icon\" aria-hidden=\"true\">\n                    <i class=\"fa-solid fa-link\"></i>\n                  </span>\n                  <span class=\"link-message-bubble__body\">\n                    <span class=\"link-message-bubble__title\" *ngIf=\"message.linkTitle\">{{ message.linkTitle }}</span>\n                    <span class=\"link-message-bubble__host\">{{ linkMessageHost(message) }}</span>\n                    <span class=\"link-message-bubble__url\" [title]=\"message.linkUrl\">{{ message.linkUrl }}</span>\n                  </span>\n                  <span class=\"link-message-bubble__open\" aria-hidden=\"true\">\n                    <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>\n                  </span>\n                </a>\n              </div>\n            </ng-container>\n            <span\n              class=\"message-bubble__text\"\n              *ngIf=\"message.content?.trim() && !message.fileUpload && !message.linkUrl\"\n              >{{ message.content }}</span\n            >\n          </div>\n        </div>\n      </div>\n\n      <div class=\"typing-indicator\" [class.show]=\"isTyping\">\n        <div class=\"typing-dots\">\n          <div class=\"typing-dot\"></div>\n          <div class=\"typing-dot\"></div>\n          <div class=\"typing-dot\"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"input-container\">\n      <div class=\"input-wrapper\">\n        <input\n          type=\"text\"\n          class=\"message-input\"\n          placeholder=\"Type your message...\"\n          aria-label=\"Message input\"\n          [(ngModel)]=\"messageInput\"\n          (keydown.enter)=\"handleSendMessage()\"\n        />\n        <div class=\"action-buttons\">\n          <button\n            *ngIf=\"ui.showClearInputButton\"\n            class=\"action-button\"\n            type=\"button\"\n            [disabled]=\"!messageInput.trim()\"\n            aria-label=\"Clear input\"\n            title=\"Clear input\"\n            (click)=\"clearInput()\"\n          >\n            <i class=\"fa-solid fa-xmark\"></i>\n          </button>\n          <button\n            *ngIf=\"ui.showToolsMenu\"\n            class=\"action-button tools-menu-trigger\"\n            type=\"button\"\n            aria-label=\"Tools\"\n            title=\"Tools\"\n            (click)=\"openTools()\"\n          >\n            <i class=\"fa-solid fa-sliders\"></i>\n          </button>\n          <button class=\"send-button\" type=\"button\" (click)=\"handleSendMessage()\">\n            <i class=\"fas fa-paper-plane\"></i>\n          </button>\n        </div>\n      </div>\n\n      <div class=\"tools-panel\" *ngIf=\"isToolsOpen && ui.showToolsMenu\">\n        <div id=\"root\">\n          <div class=\"tools-root-main\">\n            <div class=\"toolbar\" role=\"toolbar\" aria-label=\"Tools\">\n              <button\n                *ngIf=\"ui.showFileUpload\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                aria-label=\"Upload file\"\n                title=\"Upload file\"\n                (click)=\"triggerFileUpload()\"\n              >\n                <i class=\"fa-solid fa-paperclip toolbar__icon\"></i>\n              </button>\n\n              <button\n                *ngIf=\"ui.showVoiceInput\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                [class.is-listening]=\"isListening\"\n                aria-label=\"Speech to text\"\n                title=\"Speech to text\"\n                (click)=\"toggleVoiceInput()\"\n              >\n                <i class=\"fa-solid toolbar__icon\" [ngClass]=\"isListening ? 'fa-wave-square' : 'fa-microphone'\"></i>\n              </button>\n\n              <button\n                *ngIf=\"ui.showDockSideToggle\"\n                class=\"toolbar__button\"\n                type=\"button\"\n                [attr.aria-label]=\"chatDockSide === 'right' ? 'Move chat to the left' : 'Move chat to the right'\"\n                [attr.title]=\"chatDockSide === 'right' ? 'Dock chat left' : 'Dock chat right'\"\n                (click)=\"toggleChatDockSide()\"\n              >\n                <i\n                  class=\"fa-solid toolbar__icon\"\n                  [ngClass]=\"chatDockSide === 'right' ? 'fa-arrow-left-long' : 'fa-arrow-right-long'\"\n                  aria-hidden=\"true\"\n                ></i>\n              </button>\n            </div>\n            <input\n              #fileInputEl\n              type=\"file\"\n              hidden\n              accept=\".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.csv,.xls,.xlsx,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\"\n              (change)=\"handleFileSelect($event)\"\n            />\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>\n", styles: [":host{--chat-brand: #0e7d3f;--chat-brand-dark: #0a5c2e;--primary-gradient: linear-gradient(135deg, #0e7d3f, #13a354);--secondary-gradient: linear-gradient(135deg, #0b6532, #0e7d3f);--bg-color: #ffffff;--chat-bg: #f8fafc;--text-primary: #1e293b;--text-secondary: #64748b;--bot-message-bg: #f1f5f9;--user-message-bg: var(--chat-brand);--border-color: #e2e8f0;--shadow-sm: 0 1px 2px rgba(0, 0, 0, .05);--shadow-md: 0 4px 6px rgba(0, 0, 0, .1);--shadow-lg: 0 10px 15px rgba(0, 0, 0, .1);--message-bubble-max-width: 21rem}.chat-fab{position:fixed;right:24px;bottom:24px;z-index:10000;border-radius:.375rem;transition:transform .2s ease,box-shadow .2s ease,left .25s ease,right .25s ease}.chat-fab.btn-light{background:#ffffff;border:1px solid #d9e3ef}.chat-fab__logo{display:block;width:112px;height:22px;object-fit:contain}.chat-fab:hover{transform:translateY(-2px)}.chat-fab.chat-dock--left{right:auto;left:24px}.chat-panel{position:fixed;right:24px;bottom:84px;width:min(390px,100vw - 24px);height:min(640px,100vh - 110px);z-index:9999;border-radius:.375rem;overflow:hidden;transition:left .25s ease,right .25s ease}.chat-panel.chat-dock--left{right:auto;left:24px}.chat-panel:before{content:\"\";position:absolute;inset:0;background-image:url(https://cdn.biz2credit.com/templates/biz2creditmain2020/images/Biz2credit-logo.svg);background-repeat:no-repeat;background-position:center 55%;background-size:72% auto;opacity:.06;pointer-events:none;z-index:0}.chat-panel>*{position:relative;z-index:1}.ai-chat{height:100%;display:flex;flex-direction:column;background-color:var(--bg-color);color:var(--text-primary);transition:all .3s ease}.ai-chat[data-theme=dark]{--bg-color: #0f172a;--chat-bg: #1e293b;--text-primary: #f1f5f9;--text-secondary: #94a3b8;--bot-message-bg: #334155;--user-message-bg: var(--chat-brand);--border-color: #334155}.header{display:flex;justify-content:space-between;align-items:center;padding:1rem;background-color:#ffffffd9;border-bottom:1px solid var(--border-color);box-shadow:var(--shadow-sm);backdrop-filter:blur(6px)}.ai-chat[data-theme=dark] .header{background-color:#0f172ae0}.header-title{display:flex;align-items:center;min-width:0;flex:1}.header-title h1{font-size:1.1rem;font-weight:600;margin:0;min-width:0}.brand-title__name-row{display:inline-flex;align-items:center;gap:.45rem;flex-wrap:wrap;min-width:0}.brand-status{display:inline-flex;align-items:center;flex-shrink:0}.brand-status__dot{width:9px;height:9px;border-radius:50%;background:#94a3b8}.brand-status--checking .brand-status__dot{animation:status-glow-neutral 1.4s ease-in-out infinite}.brand-status--online .brand-status__dot{background:#10b981;animation:status-glow-green 2.2s ease-in-out infinite}.brand-status--offline .brand-status__dot{background:#ef4444;animation:status-glow-red 2.2s ease-in-out infinite}.ai-chat[data-theme=dark] .brand-status--online .brand-status__dot{background:#34d399}.ai-chat[data-theme=dark] .brand-status--offline .brand-status__dot{background:#f87171}@keyframes status-glow-green{0%,to{box-shadow:0 0 2px #10b98159,0 0 5px 1px #10b98124}50%{box-shadow:0 0 3px 1px #10b98173,0 0 8px 2px #10b98133}}@keyframes status-glow-red{0%,to{box-shadow:0 0 2px #ef444452,0 0 5px 1px #ef444421}50%{box-shadow:0 0 3px 1px #ef44446b,0 0 8px 2px #ef44442e}}@keyframes status-glow-neutral{0%,to{opacity:.72;box-shadow:0 0 3px #94a3b833}50%{opacity:1;box-shadow:0 0 5px 1px #94a3b847}}.brand-title{display:inline-flex;align-items:center;gap:.65rem;margin:0}.brand-title__icon{width:24px;height:24px;display:block;flex-shrink:0}.brand-title__text{display:inline-flex;flex-direction:column;line-height:1.05}.brand-title__name{font-size:1.12rem;font-weight:600;text-transform:uppercase;color:color-mix(in srgb,var(--chat-brand) 82%,#0f172a)}.brand-title__tagline{font-size:.52rem;font-weight:500;color:var(--text-secondary);margin-top:.18rem;text-transform:uppercase}.ai-chat[data-theme=dark] .brand-title__name{color:color-mix(in srgb,#ffffff 88%,var(--chat-brand))}.bot-status{display:flex;align-items:center;gap:.45rem;font-size:.78rem;color:var(--text-secondary)}.status-indicator{width:8px;height:8px;background:#10b981;border-radius:50%;animation:pulse 2s infinite}@keyframes pulse{0%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:.7}to{transform:scale(1);opacity:1}}.controls{display:flex;gap:.5rem;align-items:center}.theme-toggle{background-color:var(--bot-message-bg);border:none;cursor:pointer;color:var(--text-primary);font-size:1rem;width:34px;height:34px;border-radius:.375rem;transition:all .2s ease}.theme-toggle:hover{background-color:var(--bot-message-bg)}.reload-toggle:hover i{transform:rotate(180deg);transition:transform .25s ease}.chat-container{flex:1;overflow-y:auto;padding:1rem;background-color:color-mix(in srgb,var(--chat-bg) 88%,transparent);scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--text-secondary) 45%,transparent) transparent}.chat-container::-webkit-scrollbar{width:1px}.chat-container::-webkit-scrollbar-track{background:transparent}.chat-container::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--text-secondary) 45%,transparent);border-radius:999px}.chat-container::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb,var(--text-secondary) 65%,transparent)}.message{display:flex;align-items:flex-start;margin-bottom:1rem;opacity:0;transform:translateY(20px);animation:messageAppear .35s ease forwards}@keyframes messageAppear{to{opacity:1;transform:translateY(0)}}.avatar{width:34px;height:34px;border-radius:10px;margin-right:.65rem;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:.78rem;box-shadow:var(--shadow-md);flex-shrink:0}.user-message .avatar{background:var(--secondary-gradient)}.message-bubble{width:fit-content;max-width:min(100%,var(--message-bubble-max-width));box-sizing:border-box;padding:.85rem 1rem;border-radius:.375rem;box-shadow:var(--shadow-sm);line-height:1.5;font-size:.9rem;position:relative}.message-content{display:inline-flex;flex-direction:column;align-items:flex-start;gap:.35rem;min-width:0}.user-message .message-content{align-items:flex-end}.bot-message .message-bubble{background-color:var(--bot-message-bg);border-top-left-radius:0;padding-top:.45rem;padding-right:2.5rem;padding-bottom:1.85rem}.bubble-menu{position:absolute;top:.25rem;right:.25rem;z-index:4}.bubble-menu__trigger{width:30px;height:30px;padding:0;border:none;border-radius:.375rem;background:transparent;color:var(--text-secondary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:.95rem;transition:background-color .15s ease,color .15s ease}.bubble-menu__trigger:hover{color:var(--text-primary);background-color:color-mix(in srgb,var(--text-secondary) 14%,transparent)}.bubble-menu__trigger[aria-expanded=true]{color:var(--text-primary);background-color:color-mix(in srgb,var(--text-secondary) 18%,transparent)}.bubble-menu__panel{position:absolute;top:calc(100% + .35rem);right:0;z-index:12;margin:0;pointer-events:auto;animation:bubbleMenuIn .18s ease-out}.bubble-toolbar.toolbar{box-shadow:0 8px 20px #0000002e;padding:.15rem;gap:.12rem}.bubble-toolbar.toolbar .toolbar__button{width:24px;height:24px;min-width:24px;min-height:24px}.bubble-toolbar.toolbar .toolbar__icon{font-size:.65rem;width:1em;height:1em}.toolbar__button.is-active-feedback{background-color:#ffffff42}.copy-message-btn{position:absolute;bottom:.35rem;right:.35rem;z-index:3;border:none;background-color:color-mix(in srgb,var(--text-secondary) 12%,transparent);color:var(--text-secondary);font-size:.82rem;width:28px;height:28px;padding:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border-radius:.35rem;transition:color .15s ease,background-color .15s ease,transform .1s ease,box-shadow .1s ease;-webkit-tap-highlight-color:transparent}.copy-message-btn:hover{color:var(--text-primary)}.copy-message-btn:active{transform:scale(.88);color:var(--chat-brand);background-color:color-mix(in srgb,var(--chat-brand) 18%,transparent);box-shadow:0 0 0 2px color-mix(in srgb,var(--chat-brand) 28%,transparent)}.copy-message-btn:focus-visible{outline:2px solid color-mix(in srgb,var(--chat-brand) 55%,transparent);outline-offset:2px}.copy-message-btn__img{display:block;width:18px;height:18px;object-fit:contain;flex-shrink:0;pointer-events:none}.ai-chat[data-theme=dark] .copy-message-btn__img{filter:invert(1) brightness(1.05)}@keyframes bubbleMenuIn{0%{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.user-message{flex-direction:row-reverse}.user-message .avatar{margin-right:0;margin-left:.65rem}.user-message .message-bubble{background:var(--user-message-bg);color:#fff;border-top-right-radius:0}.bot-message .message-bubble.message-bubble--link{padding-top:.45rem;padding-right:2.5rem;padding-bottom:1.85rem}.link-message-bubble__intro{margin:0 0 .5rem;font-size:.88rem;line-height:1.45;color:inherit}.user-message .link-message-bubble__intro{color:#ffffffeb}.link-message-bubble{display:flex;flex-direction:column;gap:.4rem;width:fit-content;max-width:100%;min-width:0}.link-message-bubble__eyebrow{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85}.user-message .link-message-bubble__eyebrow{color:#ffffffbf}.bot-message .link-message-bubble__eyebrow{color:var(--text-secondary)}.link-message-bubble__card{display:flex;align-items:flex-start;gap:.65rem;padding:.7rem .75rem;border-radius:.5rem;text-decoration:none;max-width:100%;min-width:0;box-sizing:border-box;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.link-message-bubble--user .link-message-bubble__card{background:linear-gradient(165deg,rgba(255,255,255,.99) 0%,rgba(248,250,252,.98) 100%);color:#0f172a;border:1px solid rgba(255,255,255,.65);box-shadow:0 1px #ffffffd9 inset,0 6px 18px #0f172a1f}.link-message-bubble--user .link-message-bubble__card:hover{border-color:color-mix(in srgb,var(--chat-brand) 35%,#ffffff);box-shadow:0 1px #ffffffe6 inset,0 8px 22px #0f172a24}.link-message-bubble--bot .link-message-bubble__card{background:var(--bg-color);color:var(--text-primary);border:1px solid var(--border-color);box-shadow:var(--shadow-sm)}.link-message-bubble--bot .link-message-bubble__card:hover{border-color:color-mix(in srgb,var(--chat-brand) 28%,var(--border-color));box-shadow:var(--shadow-md)}.link-message-bubble__card:active{transform:scale(.99)}.link-message-bubble__icon{width:2.2rem;height:2.2rem;border-radius:.4rem;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}.link-message-bubble--user .link-message-bubble__icon{background:color-mix(in srgb,var(--chat-brand) 14%,#ffffff);color:var(--chat-brand-dark)}.link-message-bubble--bot .link-message-bubble__icon{background:color-mix(in srgb,var(--chat-brand) 12%,var(--bot-message-bg));color:var(--chat-brand)}.link-message-bubble__body{min-width:0;flex:1;display:flex;flex-direction:column;gap:.15rem}.link-message-bubble__title{font-size:.82rem;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.link-message-bubble__host{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}.link-message-bubble--user .link-message-bubble__host{color:#64748b}.link-message-bubble--bot .link-message-bubble__host{color:var(--text-secondary)}.link-message-bubble__url{font-size:.72rem;color:#64748b;word-break:break-all;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.link-message-bubble--bot .link-message-bubble__url{color:var(--text-secondary)}.link-message-bubble__open{flex-shrink:0;font-size:.78rem;opacity:.55;margin-top:.15rem}.link-message-bubble__card:hover .link-message-bubble__open{opacity:.9;color:var(--chat-brand)}.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__card{background:linear-gradient(165deg,rgba(30,41,59,.98) 0%,rgba(15,23,42,.99) 100%);color:#f1f5f9;border-color:#94a3b840}.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__url,.ai-chat[data-theme=dark] .link-message-bubble--user .link-message-bubble__host{color:#94a3b8}.file-upload-bubble{display:flex;flex-direction:column;gap:.55rem;padding:.75rem .85rem .8rem;border-radius:.5rem;background:linear-gradient(165deg,rgba(255,255,255,.99) 0%,rgba(248,250,252,.98) 100%);color:#0f172a;box-shadow:0 1px #ffffffd9 inset,0 6px 20px #0f172a1f;border:1px solid rgba(255,255,255,.65)}.file-upload-bubble__eyebrow{font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;line-height:1}.file-upload-bubble__row{display:flex;align-items:flex-start;gap:.65rem}.file-upload-bubble__icon{width:2.45rem;height:2.45rem;border-radius:.45rem;display:flex;align-items:center;justify-content:center;font-size:1.08rem;flex-shrink:0;background:color-mix(in srgb,var(--chat-brand) 14%,#ffffff);color:var(--chat-brand-dark)}.file-upload-bubble--pdf .file-upload-bubble__icon{background:color-mix(in srgb,#ef4444 16%,#ffffff);color:#b91c1c}.file-upload-bubble--image .file-upload-bubble__icon{background:color-mix(in srgb,#3b82f6 16%,#ffffff);color:#1d4ed8}.file-upload-bubble--csv .file-upload-bubble__icon{background:color-mix(in srgb,#64748b 14%,#ffffff);color:#475569}.file-upload-bubble--excel .file-upload-bubble__icon{background:color-mix(in srgb,#16a34a 16%,#ffffff);color:#15803d}.file-upload-bubble__meta{min-width:0;flex:1;display:flex;flex-direction:column;gap:.2rem}.file-upload-bubble__name{font-size:.84rem;font-weight:600;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}.file-upload-bubble__hint{font-size:.68rem;color:#64748b;font-weight:500}.file-upload-bubble__progress-wrap{display:flex;align-items:center;gap:.5rem}.file-upload-bubble__progress-track{flex:1;height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;box-shadow:0 1px 2px #0f172a0f inset}.file-upload-bubble__progress-bar{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--chat-brand-dark),var(--chat-brand));transition:width .14s ease-out;box-shadow:0 0 12px color-mix(in srgb,var(--chat-brand) 45%,transparent)}.file-upload-bubble__pct{font-size:.68rem;font-weight:700;font-variant-numeric:tabular-nums;color:#475569;min-width:2.35rem;text-align:right}.file-upload-bubble__done{margin-top:-.15rem}.file-upload-bubble__done-badge{display:inline-flex;align-items:center;gap:.35rem;font-size:.74rem;font-weight:700;color:#15803d;padding:.25rem .45rem .25rem .35rem;border-radius:.35rem;background:color-mix(in srgb,#22c55e 12%,#ffffff)}.file-upload-bubble__done-badge i{font-size:.85rem;color:#16a34a}.file-upload-bubble__error{display:flex;align-items:center;gap:.4rem;font-size:.74rem;font-weight:600;color:#b91c1c;padding:.35rem .45rem;border-radius:.35rem;background:color-mix(in srgb,#ef4444 10%,#ffffff)}.ai-chat[data-theme=dark] .file-upload-bubble{background:linear-gradient(165deg,rgba(30,41,59,.98) 0%,rgba(15,23,42,.99) 100%);color:#f1f5f9;border-color:#94a3b840;box-shadow:0 1px #ffffff0f inset,0 8px 24px #00000059}.ai-chat[data-theme=dark] .file-upload-bubble__eyebrow{color:#94a3b8}.ai-chat[data-theme=dark] .file-upload-bubble__name{color:#f8fafc}.ai-chat[data-theme=dark] .file-upload-bubble__hint{color:#94a3b8}.ai-chat[data-theme=dark] .file-upload-bubble__progress-track{background:#334155;box-shadow:0 1px 2px #00000040 inset}.ai-chat[data-theme=dark] .file-upload-bubble__pct{color:#cbd5e1}.ai-chat[data-theme=dark] .file-upload-bubble__done-badge{background:color-mix(in srgb,#22c55e 18%,#1e293b);color:#86efac}.ai-chat[data-theme=dark] .file-upload-bubble__done-badge i{color:#4ade80}.ai-chat[data-theme=dark] .file-upload-bubble__error{background:color-mix(in srgb,#ef4444 15%,#1e293b);color:#fca5a5}.typing-indicator{display:none;padding:.8rem 1rem;background-color:var(--bot-message-bg);border-radius:.9rem;width:fit-content;margin-left:2.6rem;box-shadow:var(--shadow-sm)}.typing-indicator.show{display:block}.typing-dots{display:flex;gap:.35rem}.typing-dot{width:7px;height:7px;background-color:var(--text-secondary);border-radius:50%;animation:typingBounce 1.4s infinite ease-in-out}.typing-dot:nth-child(1){animation-delay:-.32s}.typing-dot:nth-child(2){animation-delay:-.16s}@keyframes typingBounce{0%,80%,to{transform:scale(0)}40%{transform:scale(1)}}.input-container{padding:.9rem;background-color:color-mix(in srgb,var(--bg-color) 95%,transparent);border-top:1px solid var(--border-color);box-shadow:var(--shadow-lg);backdrop-filter:blur(6px);position:relative;overflow:visible}.input-wrapper{display:flex;gap:.55rem;background-color:var(--chat-bg);border-radius:.85rem;padding:.4rem .6rem;box-shadow:var(--shadow-sm)}.message-input{flex:1;padding:.7rem .8rem;border:none;background:none;color:var(--text-primary);font-size:.93rem}.message-input:focus{outline:none}.message-input::placeholder{color:var(--text-secondary)}.action-buttons{display:flex;gap:.35rem;align-items:center}.action-button{background:none;border:none;width:34px;height:34px;color:var(--text-secondary);cursor:pointer;border-radius:.5rem;transition:all .2s ease}.action-button:hover{background-color:var(--bot-message-bg);color:var(--text-primary)}.send-button{background:var(--primary-gradient);color:#fff;border:none;padding:.65rem .95rem;border-radius:.5rem;cursor:pointer;transition:all .2s ease;font-weight:500;display:flex;align-items:center;gap:.45rem;font-size:.85rem}.send-button:hover{opacity:.93;transform:translateY(-1px)}.tools-panel{position:absolute;right:.9rem;bottom:calc(100% + .45rem);z-index:20;margin:0;pointer-events:auto;animation:toolsPopoverIn .18s ease-out}#root{width:auto}.tools-root-main{display:flex;justify-content:flex-end}.toolbar{background-color:var(--chat-brand);border-radius:.375rem;display:inline-flex;gap:.25rem;align-items:center;position:relative;padding:.25rem;min-width:2em;height:auto;box-shadow:0 8px 20px #0000002e}@keyframes toolsPopoverIn{0%{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.toolbar__button{background-color:#80808000;border:0;padding:0;border-radius:.375rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;position:relative;width:34px;height:34px;min-width:34px;min-height:34px;z-index:2}.toolbar__button[aria-pressed=false]:hover,.toolbar__button:hover{background-color:#ffffff2e}.toolbar__button.is-listening{background-color:#ffffff42}.toolbar__button-tip{background-color:var(--chat-brand-dark);border-radius:.5625rem;color:#fff;font-size:.625em;line-height:1;margin-top:.375rem;opacity:0;padding:.25rem .5rem;pointer-events:none;position:absolute;top:100%;left:50%;transform:translate(-50%,-25%);transition:opacity .2s ease,transform .2s ease,visibility .2s ease;visibility:hidden;white-space:nowrap}.toolbar__button:focus-visible .toolbar__button-tip,.toolbar__button:hover .toolbar__button-tip{opacity:1;visibility:visible;transform:translate(-50%)}.toolbar__highlight{background-color:#fff;border-radius:.875em;margin:.125em;pointer-events:none;position:absolute;top:0;width:1.75em;height:1.75em;transition:left .3s cubic-bezier(.65,0,.35,1);z-index:1}.toolbar__icon{color:#fff;display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;line-height:1;font-size:.85rem}@media (max-width: 420px){.chat-panel{right:12px;bottom:74px;width:calc(100vw - 24px);height:min(640px,100vh - 88px)}.chat-panel.chat-dock--left{right:auto;left:12px}.chat-fab{right:12px;bottom:12px}.chat-fab.chat-dock--left{right:auto;left:12px}.message-bubble{max-width:min(84%,var(--message-bubble-max-width))}}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: i1.HttpClient }]; }, propDecorators: { config: [{
                type: Input
            }], chatContainer: [{
                type: ViewChild,
                args: ['chatContainer']
            }], fileInputEl: [{
                type: ViewChild,
                args: ['fileInputEl']
            }], onDocumentClick: [{
                type: HostListener,
                args: ['document:click', ['$event']]
            }] } });

class BotLibModule {
}
BotLibModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: BotLibModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
BotLibModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.3.0", ngImport: i0, type: BotLibModule, declarations: [BizzyBotComponent], imports: [CommonModule, HttpClientModule, FormsModule], exports: [BizzyBotComponent] });
BotLibModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: BotLibModule, imports: [CommonModule, HttpClientModule, FormsModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.3.0", ngImport: i0, type: BotLibModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [BizzyBotComponent],
                    imports: [CommonModule, HttpClientModule, FormsModule],
                    exports: [BizzyBotComponent],
                }]
        }] });

/*
 * Public API Surface of bot-lib
 */

/**
 * Generated bundle index. Do not edit.
 */

export { BIZZY_BOT_AGENT_QUERY_URL, BIZZY_BOT_AGENT_UPLOAD_QUERY, BIZZY_BOT_AGENT_USER_ID, BIZZY_BOT_DEFAULT_WIDGET_CONFIG, BIZZY_BOT_FEEDBACK_API_BASE, BIZZY_BOT_FEEDBACK_PING_URL, BIZZY_BOT_FEEDBACK_URL, BizzyBotComponent, BotLibModule, mergeBizzyBotWidgetConfig, parseBizzyBotConfigInput };
//# sourceMappingURL=bot-lib.mjs.map
