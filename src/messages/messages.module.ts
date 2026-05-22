import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ProviderFactory } from './provider.factory';
import { DiscordWebHookService } from './services/discord-webhook.service';
import { DiscordBotService } from './services/discord-bot.service';
import { SlackWebHookService } from './services/slack-webhook.service';
import { TelegramBotService } from './services/telegram.service';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    ProviderFactory,
    DiscordWebHookService,
    DiscordBotService,
    SlackWebHookService,
    TelegramBotService,
  ],
})
export class MessagesModule {}
