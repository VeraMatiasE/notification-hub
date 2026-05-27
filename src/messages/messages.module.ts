import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ProviderFactory } from './provider.factory';
import { DiscordWebHookService } from './services/discord-webhook.service';
import { DiscordBotService } from './services/discord-bot.service';
import { SlackWebHookService } from './services/slack-webhook.service';
import { TelegramBotService } from './services/telegram.service';
import { PrismaModule } from 'src/database/prisma.module';
import { MessageRateLimitService } from './services/message-rate-limit.service';
import { MessageDeliveryService } from './message-delivery.service';
import { MessagesRepository } from './messages.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesRepository,
    MessageDeliveryService,
    ProviderFactory,
    DiscordWebHookService,
    DiscordBotService,
    SlackWebHookService,
    TelegramBotService,
    MessageRateLimitService,
  ],
})
export class MessagesModule {}
