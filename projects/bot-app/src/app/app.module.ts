import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BotLibModule } from '../../../bot-lib/src/public-api';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BotLibModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
