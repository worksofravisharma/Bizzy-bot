import defaultJson from './bizzy-bot-default.config.json';

/** CSS custom properties applied on the component host (kebab-case keys, no leading `--`). */
export type BizzyBotThemeConfig = Record<string, string>;

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

export const BIZZY_BOT_DEFAULT_WIDGET_CONFIG: BizzyBotWidgetConfig =
  defaultJson as BizzyBotWidgetConfig;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function mergeBizzyBotWidgetConfig(
  base: BizzyBotWidgetConfig,
  patch: Partial<BizzyBotWidgetConfig> | null | undefined
): BizzyBotWidgetConfig {
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
export function parseBizzyBotConfigInput(
  input: string | Record<string, unknown> | null | undefined
): Partial<BizzyBotWidgetConfig> | null {
  if (input == null || input === '') {
    return null;
  }
  if (typeof input === 'object') {
    return input as BizzyBotWidgetConfig;
  }
  const s = String(input).trim();
  if (!s) {
    return null;
  }
  try {
    return JSON.parse(s) as BizzyBotWidgetConfig;
  } catch {
    return null;
  }
}
