import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderInterface } from '../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService implements ProviderInterface, OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private bot!: Telegraf;

  onModuleInit() {
    this.bot = new Telegraf(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    );

    this.bot
      .launch()
      .then(() => console.log('Telegram bot launched'))
      .catch(console.error);
  }

  async sendMessage(channelId: string, content: string) {
    await this.bot.telegram.sendMessage(channelId, content);
  }
}
