import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderInterface } from '../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/webhook';
import { ProviderSendMessageResponse } from '../types/provider-response.type';
import { toJson } from '../utils/to-json.util';

@Injectable()
export class SlackWebHookService implements ProviderInterface {
  private webhooks: Record<string, string | undefined>;

  constructor(private readonly configService: ConfigService) {
    this.webhooks = {
      testing: this.configService.get('SLACK_WEBHOOK'),
    };
  }

  async sendMessage(
    channelName: string,
    content: string,
  ): Promise<ProviderSendMessageResponse> {
    const webhookUrl = this.webhooks[channelName];

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
