import { BadRequestException, Injectable } from '@nestjs/common';
import { ProvidersName } from '../dto/send-message.dto';
import { ProviderInterface } from './provider.interface';
import { DiscordWebHookService } from './discord-webhook.service';
import { SlackWebHookService } from './slack-webhook.service';
import { TelegramBotService } from './telegram.service';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly discordService: DiscordWebHookService,
    private readonly slackService: SlackWebHookService,
    private readonly telegramService: TelegramBotService,
  ) {}

  getProvider(providerName: ProvidersName): ProviderInterface {
    switch (providerName) {
      case ProvidersName.DISCORD:
        return this.discordService;

      case ProvidersName.SLACK:
        return this.slackService;

      case ProvidersName.TELEGRAM:
        return this.telegramService;

      default:
        throw new BadRequestException('Invalid provider');
    }
  }
}
