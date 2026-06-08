import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderInterface } from './provider.interface';
import { WebhookClient } from 'discord.js';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from 'src/common/utils/to-json.util';
import { ProviderChannel } from 'src/generated/prisma/client';

@Injectable()
export class DiscordWebHookService implements ProviderInterface {
  private channels: Map<string, string> = new Map();

  loadChannels(channels: ProviderChannel[]): void {
    this.channels = new Map(
      channels.filter((c) => c.isActive).map((c) => [c.name, c.destination]),
    );
  }

  async sendMessage(
    channelName: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const webhookUrl = this.channels.get(channelName);
    if (!webhookUrl) {
      throw new BadRequestException(
        `Discord channel "${channelName}" not found or inactive`,
      );
    }

    const webhookClient = new WebhookClient({
      url: webhookUrl,
    });

    const response = await webhookClient.send({
      content,
    });

    return {
      sentAt: new Date(response.timestamp),
      raw: toJson(response),
    };
  }
}
