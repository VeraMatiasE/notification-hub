import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderInterface } from '../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from '../utils/to-json.util';

@Injectable()
export class DiscordBotService implements ProviderInterface, OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private readonly client = new Client({ intents: [GatewayIntentBits.Guilds] });

  async onModuleInit() {
    await this.client.login(this.configService.getOrThrow('DISCORD_TOKEN'));
  }

  async sendMessage(
    channelId: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const channel = await this.client.channels.fetch(channelId);

    if (!channel) {
      throw new Error('Discord channel not found');
    }

    if (!channel.isTextBased()) {
      throw new Error('Discord channel is not text based');
    }

    if (!channel?.isSendable()) {
      throw new Error('Discord channel is not sendable');
    }

    const response = await channel.send(content);

    return {
      sentAt: new Date(response.createdTimestamp),
      raw: toJson(response),
    };
  }
}
