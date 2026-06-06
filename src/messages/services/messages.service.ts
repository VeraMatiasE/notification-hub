import { BadRequestException, Injectable } from '@nestjs/common';
import { SendMessageDto } from '../dto/send-message.dto';
import { GetMessagesFiltersDto } from '../dto/get-messages-filters.dto';
import { Status } from 'src/generated/prisma/client';
import { MessageRateLimitService } from '../services/message-rate-limit.service';
import { MessagesRepository } from '../repositories/messages.repository';
import { MessageDeliveryService } from './message-delivery.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly messageRateLimitService: MessageRateLimitService,
    private readonly messageDeliveryService: MessageDeliveryService,
  ) {}

  async getMessagesByUserId(userId: number, filters: GetMessagesFiltersDto) {
    return await this.messagesRepository.getMessagesByUserId(userId, filters);
  }

  async sendMessagesToProviders(messageDto: SendMessageDto, userId: number) {
    await this.messageRateLimitService.validateUserDailyLimit(userId);

    const message = await this.messagesRepository.createMessage(
      messageDto.content,
      userId,
    );

    const providers = await this.messagesRepository.getActiveProviders();

    const providersMap = new Map<string, number>(
      providers.map((provider) => [provider.name, provider.id]),
    );

    const deliveriesData = messageDto.providers.map((provider) => {
      const providerId = providersMap.get(provider.name);

      if (!providerId) {
        throw new BadRequestException(`Provider "${provider.name}" not found`);
      }

      return {
        destination: provider.destination,
        messageId: message.id,
        messageProviderId: providerId,
        status: Status.PENDING,
      };
    });

    const createdDeliveries =
      await this.messagesRepository.createDeliveries(deliveriesData);

    const results = await this.messageDeliveryService.processDeliveries(
      createdDeliveries,
      messageDto.content,
    );

    return {
      messageId: message.id.toString(),
      deliveries: results,
    };
  }
}
