import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { BotLibModule, BizzyBotComponent } from '../../../bot-lib/src/public-api';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BotLibModule],
  bootstrap: [],
})
export class AppModule implements DoBootstrap {
  constructor(private readonly injector: Injector) {
    if (!customElements.get('lib-bizzy-bot')) {
      const ngElement = createCustomElement(BizzyBotComponent, {
        injector: this.injector,
      });
      customElements.define('lib-bizzy-bot', ngElement);
    }
  }

  ngDoBootstrap(): void {}
}
