import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderInterface } from './provider.interface';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from 'src/common/utils/to-json.util';

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

  async sendMessage(
    channelId: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const response = await this.bot.telegram.sendMessage(channelId, content);
    return {
      sentAt: new Date(response.date * 1000),
      raw: toJson(response),
    };
  }
}
