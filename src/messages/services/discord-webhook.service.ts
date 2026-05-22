import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderInterface } from '../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import { WebhookClient } from 'discord.js';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from '../utils/to-json.util';

@Injectable()
export class DiscordWebHookService implements ProviderInterface {
  private webhooks: Record<string, string | undefined>;

  constructor(private readonly configService: ConfigService) {
    this.webhooks = {
      testing: this.configService.get('DISCORD_WEBHOOK'),
    };
  }

  async sendMessage(
    channelName: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const webhookUrl = this.webhooks[channelName];

    if (!webhookUrl) {
      throw new BadRequestException(
        `Discord destination "${channelName}" not found`,
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
