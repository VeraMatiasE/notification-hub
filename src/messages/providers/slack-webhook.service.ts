import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderInterface } from './provider.interface';
import { IncomingWebhook } from '@slack/webhook';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from 'src/common/utils/to-json.util';
import { ProviderChannel } from 'src/generated/prisma/client';

@Injectable()
export class SlackWebHookService implements ProviderInterface {
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
        `Slack destination "${channelName}" not found`,
      );
    }

    const webhook = new IncomingWebhook(webhookUrl);

    const response = await webhook.send({
      text: content,
    });

    return {
      raw: toJson(response),
    };
  }
}
