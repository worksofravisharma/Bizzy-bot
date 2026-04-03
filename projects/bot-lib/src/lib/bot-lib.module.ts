import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BizzyBotComponent } from './bizzy-bot/bizzy-bot.component';

@NgModule({
  declarations: [BizzyBotComponent],
  imports: [CommonModule, HttpClientModule, FormsModule],
  exports: [BizzyBotComponent],
})
export class BotLibModule {}
