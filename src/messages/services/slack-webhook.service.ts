import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderInterface } from '../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/webhook';

@Injectable()
export class SlackWebHookService implements ProviderInterface {
  private webhooks: Record<string, string | undefined>;

  constructor(private readonly configService: ConfigService) {
    this.webhooks = {
      testing: this.configService.get('SLACK_WEBHOOK'),
    };
  }

  async sendMessage(channelName: string, content: string) {
    const webhookUrl = this.webhooks[channelName];

    if (!webhookUrl) {
      throw new BadRequestException(
        `Slack destination "${channelName}" not found`,
      );
    }

    const webhook = new IncomingWebhook(webhookUrl);

    await webhook.send({ text: content });
  }
}
