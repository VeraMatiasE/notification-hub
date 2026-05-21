import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ProviderFactory } from './provider.factory';
import { DiscordWebHookService } from './services/discord-webhook.service';
import { DiscordBotService } from './services/discord-bot.service';

@Module({
  imports: [],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    ProviderFactory,
    DiscordWebHookService,
    DiscordBotService,
  ],
})
export class MessagesModule {}
