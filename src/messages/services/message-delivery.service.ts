import { Injectable } from '@nestjs/common';
import { Status } from 'src/generated/prisma/client';
import { MessagesRepository } from '../repositories/messages.repository';
import { ProviderFactory } from '../providers/provider.factory';
import { ProvidersName } from '../dto/send-message.dto';
import { ProviderInterface } from '../providers/provider.interface';
import { withTimeout } from 'src/common/utils/with-timeout.util';

interface DeliveryWithProvider {
  id: bigint;
  destination: string;

  messageProvider: {
    name: string;
  };
}

@Injectable()
export class MessageDeliveryService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  async processDeliveries(deliveries: DeliveryWithProvider[], content: string) {
    const PROVIDER_TIMEOUT_MS = 5000;

    const tasks = deliveries.map(async (delivery) => {
      try {
        const provider: ProviderInterface = this.providerFactory.getProvider(
          delivery.messageProvider.name as ProvidersName,
        );

        const providerResponse = await withTimeout(
          provider.sendMessage(delivery.destination, content),
          PROVIDER_TIMEOUT_MS,
          delivery.messageProvider.name,
        );

        await this.messagesRepository.updateDeliveryStatus(delivery.id, {
          status: Status.SUCCESS,
          sentAt: new Date(),
          providerResponse,
        });

        return {
          deliveryId: delivery.id.toString(),
          provider: delivery.messageProvider.name,
          destination: delivery.destination,
          status: Status.SUCCESS,
        };
      } catch (error: unknown) {
        let errorMessage = 'Unknown error';

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        await this.messagesRepository.updateDeliveryStatus(delivery.id, {
          status: Status.FAILED,
          errorMessage,
        });

        return {
          deliveryId: delivery.id.toString(),
          provider: delivery.messageProvider.name,
          destination: delivery.destination,
          status: Status.FAILED,
          errorMessage,
        };
      }
    });

    return await Promise.all(tasks);
  }
}
