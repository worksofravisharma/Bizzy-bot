import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BotLibModule } from '../bot-lib.module';
import { BIZZY_BOT_DEFAULT_WIDGET_CONFIG } from '../config/bizzy-bot-widget-config';
import {
  BIZZY_BOT_AGENT_QUERY_URL,
  BIZZY_BOT_AGENT_USER_ID,
  BizzyBotComponent,
} from './bizzy-bot.component';

@Component({
  template: `<lib-bizzy-bot [config]="cfg"></lib-bizzy-bot>`,
})
class BizzyBotHostComponent {
  cfg: string | Record<string, unknown> | null = null;
}

describe('BizzyBotComponent', () => {
  let hostFixture: ComponentFixture<BizzyBotHostComponent>;
  let host: BizzyBotHostComponent;
  let bot: BizzyBotComponent;

  function createHost(): void {
    hostFixture = TestBed.createComponent(BizzyBotHostComponent);
    host = hostFixture.componentInstance;
    const el = hostFixture.debugElement.query(By.css('lib-bizzy-bot'));
    bot = el.componentInstance as BizzyBotComponent;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BotLibModule],
      declarations: [BizzyBotHostComponent],
    }).compileComponents();

    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
  });

  it('should create', () => {
    createHost();
    hostFixture.detectChanges();
    expect(bot).toBeTruthy();
  });

  it('should seed welcome message from default config on init', () => {
    createHost();
    hostFixture.detectChanges();
    expect(bot.messages.length).toBe(1);
    expect(bot.messages[0].isUser).toBe(false);
    expect(bot.messages[0].content).toContain('Bizzy');
    expect(bot.widgetConfig.brandName).toBe(BIZZY_BOT_DEFAULT_WIDGET_CONFIG.brandName);
  });

  it('should merge config from host binding before first init', () => {
    createHost();
    host.cfg = {
      brandName: 'Acme Assistant',
      brandTagline: 'Hello world',
      welcomeMessage: 'Custom welcome.',
    };
    hostFixture.detectChanges();
    expect(bot.widgetConfig.brandName).toBe('Acme Assistant');
    expect(bot.widgetConfig.brandTagline).toBe('Hello world');
    expect(bot.messages[0].content).toBe('Custom welcome.');
  });

  it('should merge config from JSON string', () => {
    createHost();
    host.cfg = JSON.stringify({ brandName: 'JSON Bot' });
    hostFixture.detectChanges();
    expect(bot.widgetConfig.brandName).toBe('JSON Bot');
  });

  it('should apply theme variables to host element', () => {
    createHost();
    host.cfg = { theme: { 'chat-brand': '#aabbcc' } };
    hostFixture.detectChanges();
    const el = hostFixture.debugElement.query(By.css('lib-bizzy-bot')).nativeElement as HTMLElement;
    expect(el.style.getPropertyValue('--chat-brand').trim()).toBe('#aabbcc');
  });

  it('should hide launch button when widgets.showLaunchButton is false', () => {
    createHost();
    host.cfg = { widgets: { showLaunchButton: false } };
    hostFixture.detectChanges();
    expect(bot.ui.showLaunchButton).toBe(false);
    expect(hostFixture.debugElement.query(By.css('.chat-fab'))).toBeNull();
  });

  it('should toggle chat open state', fakeAsync(() => {
    createHost();
    hostFixture.detectChanges();
    expect(bot.isChatOpen).toBe(false);
    bot.toggleChat();
    expect(bot.isChatOpen).toBe(true);
    tick();
    bot.toggleChat();
    expect(bot.isChatOpen).toBe(false);
    tick();
  }));

  it('should close chat and reset tools state', () => {
    createHost();
    hostFixture.detectChanges();
    bot.isChatOpen = true;
    bot.isToolsOpen = true;
    bot.closeChat();
    expect(bot.isChatOpen).toBe(false);
    expect(bot.isToolsOpen).toBe(false);
  });

  it('should send user message and POST agent query when input is non-empty', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    createHost();
    hostFixture.detectChanges();
    const initialLen = bot.messages.length;
    bot.messageInput = '  hello  ';
    bot.handleSendMessage();
    expect(bot.messageInput).toBe('');
    expect(bot.messages.length).toBe(initialLen + 1);
    const userMsg = bot.messages[bot.messages.length - 1];
    expect(userMsg.isUser).toBe(true);
    expect(userMsg.content).toBe('hello');

    const req = httpMock.expectOne(BIZZY_BOT_AGENT_QUERY_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userId: BIZZY_BOT_AGENT_USER_ID,
      query: 'hello',
      payslipMimeType: '',
      payslipBase64: '',
    });
    req.flush({ answer: 'Hi from agent' });
    hostFixture.detectChanges();
    expect(bot.isTyping).toBe(false);
    expect(bot.messages[bot.messages.length - 1].content).toBe('Hi from agent');
    expect(bot.messages[bot.messages.length - 1].isUser).toBe(false);
    httpMock.verify();
  });

  it('should not send when input is empty', () => {
    createHost();
    hostFixture.detectChanges();
    const n = bot.messages.length;
    bot.messageInput = '   ';
    bot.handleSendMessage();
    expect(bot.messages.length).toBe(n);
  });

  it('reloadChat should reset to welcome message from config', () => {
    createHost();
    host.cfg = { welcomeMessage: 'Welcome back.' };
    hostFixture.detectChanges();
    bot.messageInput = 'x';
    bot.messages.push({ content: 'temp', isUser: true });
    bot.reloadChat();
    expect(bot.messages.length).toBe(1);
    expect(bot.messages[0].content).toBe('Welcome back.');
    expect(bot.messageInput).toBe('');
  });

  it('toggleTheme should flip dark flag', () => {
    createHost();
    hostFixture.detectChanges();
    expect(bot.isDarkTheme).toBe(false);
    bot.toggleTheme();
    expect(bot.isDarkTheme).toBe(true);
  });

  it('setBotFeedback should set feedback on bot messages only', () => {
    createHost();
    hostFixture.detectChanges();
    bot.setBotFeedback(0, 'up');
    expect(bot.messages[0].feedback).toBe('up');
    bot.messages.push({ content: 'u', isUser: true });
    bot.setBotFeedback(1, 'down');
    expect(bot.messages[1].feedback).toBeUndefined();
  });

  it('fileUploadIconClass returns expected Font Awesome class', () => {
    createHost();
    hostFixture.detectChanges();
    const msg = {
      content: '',
      isUser: true,
      fileUpload: { fileName: 'doc.pdf', progress: 0, state: 'uploading' as const },
    };
    expect(bot.fileUploadIconClass(msg)).toBe('fa-file-pdf');
    msg.fileUpload!.fileName = 'x.png';
    expect(bot.fileUploadIconClass(msg)).toBe('fa-file-image');
  });

  it('fileUploadKind returns expected kind', () => {
    createHost();
    hostFixture.detectChanges();
    const msg = {
      content: '',
      isUser: true,
      fileUpload: { fileName: 'a.xlsx', progress: 0, state: 'uploading' as const },
    };
    expect(bot.fileUploadKind(msg)).toBe('excel');
  });

  it('brandIconSrc uses config URL when set', () => {
    createHost();
    host.cfg = { brandIconUrl: 'https://example.com/icon.png' };
    hostFixture.detectChanges();
    expect(bot.brandIconSrc).toBe('https://example.com/icon.png');
  });

  it('should update config when host binding changes', () => {
    createHost();
    host.cfg = { brandName: 'One' };
    hostFixture.detectChanges();
    expect(bot.widgetConfig.brandName).toBe('One');
    host.cfg = { brandName: 'Two' };
    hostFixture.detectChanges();
    expect(bot.widgetConfig.brandName).toBe('Two');
  });
});
