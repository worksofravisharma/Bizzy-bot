import {
  BIZZY_BOT_DEFAULT_WIDGET_CONFIG,
  BizzyBotWidgetConfig,
  mergeBizzyBotWidgetConfig,
  parseBizzyBotConfigInput,
} from './bizzy-bot-widget-config';

describe('bizzy-bot-widget-config', () => {
  describe('mergeBizzyBotWidgetConfig', () => {
    it('returns a clone of base when patch is null', () => {
      const out = mergeBizzyBotWidgetConfig(BIZZY_BOT_DEFAULT_WIDGET_CONFIG, null);
      expect(out.brandName).toBe(BIZZY_BOT_DEFAULT_WIDGET_CONFIG.brandName);
      expect(out).not.toBe(BIZZY_BOT_DEFAULT_WIDGET_CONFIG);
      expect(out.theme).not.toBe(BIZZY_BOT_DEFAULT_WIDGET_CONFIG.theme);
    });

    it('merges brand and nested theme/widgets', () => {
      const out = mergeBizzyBotWidgetConfig(BIZZY_BOT_DEFAULT_WIDGET_CONFIG, {
        brandName: 'Acme',
        theme: { 'chat-brand': '#ff00aa' },
        widgets: { showVoiceInput: false },
      });
      expect(out.brandName).toBe('Acme');
      expect(out.theme?.['chat-brand']).toBe('#ff00aa');
      expect(out.widgets?.showVoiceInput).toBe(false);
      expect(out.theme?.['bg-color']).toBe(BIZZY_BOT_DEFAULT_WIDGET_CONFIG.theme?.['bg-color']);
    });
  });

  describe('parseBizzyBotConfigInput', () => {
    it('returns null for empty input', () => {
      expect(parseBizzyBotConfigInput(null)).toBeNull();
      expect(parseBizzyBotConfigInput('')).toBeNull();
      expect(parseBizzyBotConfigInput('   ')).toBeNull();
    });

    it('parses valid JSON string', () => {
      const out = parseBizzyBotConfigInput('{"brandName":"X"}');
      expect(out?.brandName).toBe('X');
    });

    it('returns null for invalid JSON string', () => {
      expect(parseBizzyBotConfigInput('not json')).toBeNull();
    });

    it('passes through plain object', () => {
      const obj: BizzyBotWidgetConfig = { brandName: 'Y' };
      expect(parseBizzyBotConfigInput(obj as Record<string, unknown>)).toBe(obj);
    });
  });
});
