import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BizzyBotComponent } from './bizzy-bot/bizzy-bot.component';

@NgModule({
  declarations: [BizzyBotComponent],
  imports: [CommonModule, FormsModule],
  exports: [BizzyBotComponent],
})
export class BotLibModule {}
