import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderInterface } from './provider.interface';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from 'src/common/utils/to-json.util';
import { ProviderChannel } from 'src/generated/prisma/client';

@Injectable()
export class TelegramBotService implements ProviderInterface, OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private bot!: Telegraf;
  private channels: Map<string, string> = new Map();

  onModuleInit() {
    this.bot = new Telegraf(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    );

    this.bot
      .launch()
      .then(() => console.log('Telegram bot launched'))
      .catch(console.error);
  }

  loadChannels(channels: ProviderChannel[]): void {
    this.channels = new Map(
      channels.filter((c) => c.isActive).map((c) => [c.name, c.destination]),
    );
  }

  async sendMessage(
    channelName: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const chatId = this.channels.get(channelName);
    if (!chatId) {
      throw new BadRequestException(
        `Telegram channel "${channelName}" not found or inactive`,
      );
    }

    const response = await this.bot.telegram.sendMessage(chatId, content);
    return {
      sentAt: new Date(response.date * 1000),
      raw: toJson(response),
    };
  }
}
