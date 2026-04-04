/** CSS custom properties applied on the component host (kebab-case keys, no leading `--`). */
export declare type BizzyBotThemeConfig = Record<string, string>;
export interface BizzyBotWidgetsConfig {
    showLaunchButton?: boolean;
    showThemeToggle?: boolean;
    showReloadButton?: boolean;
    showCloseButton?: boolean;
    showBubbleMenu?: boolean;
    showCopyButton?: boolean;
    showClearInputButton?: boolean;
    showToolsMenu?: boolean;
    showFileUpload?: boolean;
    showVoiceInput?: boolean;
    showDockSideToggle?: boolean;
}
export interface BizzyBotWidgetConfig {
    brandName?: string;
    brandTagline?: string;
    /** Optional header icon (replaces default data-URL icon when set). */
    brandIconUrl?: string;
    /** Logo on the floating launcher button. */
    fabLogoUrl?: string;
    welcomeMessage?: string;
    theme?: BizzyBotThemeConfig;
    widgets?: BizzyBotWidgetsConfig;
}
export declare const BIZZY_BOT_DEFAULT_WIDGET_CONFIG: BizzyBotWidgetConfig;
export declare function mergeBizzyBotWidgetConfig(base: BizzyBotWidgetConfig, patch: Partial<BizzyBotWidgetConfig> | null | undefined): BizzyBotWidgetConfig;
/** Parse `config` @Input: JSON string or object (encrypted payloads can be swapped in later). */
export declare function parseBizzyBotConfigInput(input: string | Record<string, unknown> | null | undefined): Partial<BizzyBotWidgetConfig> | null;
