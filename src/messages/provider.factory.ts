import { BadRequestException, Injectable } from '@nestjs/common';
import { ProvidersName } from './messages.dto';
import { ProviderInterface } from './interfaces/provider.interface';
import { DiscordWebHookService } from './services/discord-webhook.service';
import { DiscordBotService } from './services/discord-bot.service';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly discordService: DiscordWebHookService /*DiscordBotService*/,
  ) {}

  getProvider(providerName: ProvidersName): ProviderInterface {
    switch (providerName) {
      case ProvidersName.DISCORD:
        return this.discordService;

      default:
        throw new BadRequestException('Invalid provider');
    }
  }
}
