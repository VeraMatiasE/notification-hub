import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './services/messages.service';
import { ProviderFactory } from './providers/provider.factory';
import { DiscordWebHookService } from './providers/discord-webhook.service';
import { DiscordBotService } from './providers/discord-bot.service';
import { SlackWebHookService } from './providers/slack-webhook.service';
import { TelegramBotService } from './providers/telegram.service';
import { PrismaModule } from 'src/database/prisma.module';
import { MessageRateLimitService } from './services/message-rate-limit.service';
import { MessageDeliveryService } from './services/message-delivery.service';
import { MessagesRepository } from './repositories/messages.repository';

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
