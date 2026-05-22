import { BadRequestException, Injectable } from '@nestjs/common';
import { ProvidersName } from './messages.dto';
import { ProviderInterface } from './interfaces/provider.interface';
import { DiscordWebHookService } from './services/discord-webhook.service';
import { DiscordBotService } from './services/discord-bot.service';
import { SlackWebHookService } from './services/slack-webhook.service';
import { TelegramBotService } from './services/telegram.service';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly discordService: DiscordWebHookService /*DiscordBotService*/,
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
