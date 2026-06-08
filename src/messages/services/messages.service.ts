import { Injectable } from '@nestjs/common';
import { SendMessageDto } from '../dto/send-message.dto';
import { GetMessagesFiltersDto } from '../dto/get-messages-filters.dto';
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

  async sendMessagesToProviders(
    messageDto: SendMessageDto,
    userId: number,
    username: string,
  ) {
    const signedContent = `[${username}] ${messageDto.content}`;

    await this.messageRateLimitService.ensureUserCanSendMessage(userId);

    const providers = await this.messagesRepository.getActiveProviders();

    const providersMap = this.createProvidersMap(providers);

    const { message, deliveries } =
      await this.messagesRepository.createMessageWithDeliveries(
        messageDto,
        userId,
        providersMap,
      );

    const results = await this.messageDeliveryService.processDeliveries(
      deliveries,
      signedContent,
    );

    return {
      messageId: message.id.toString(),
      deliveries: results,
    };
  }

  private createProvidersMap(
    providers: { id: number; name: string }[],
  ): Map<string, number> {
    return new Map(providers.map((p) => [p.name, p.id]));
  }
}
