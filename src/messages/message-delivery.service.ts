import { Injectable } from '@nestjs/common';
import { Status } from 'src/generated/prisma/client';
import { MessagesRepository } from './messages.repository';
import { ProviderFactory } from './provider.factory';
import { ProvidersName } from './messages.dto';
import { ProviderInterface } from './interfaces/provider.interface';

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
    const tasks = deliveries.map(async (delivery) => {
      try {
        const provider: ProviderInterface = this.providerFactory.getProvider(
          delivery.messageProvider.name as ProvidersName,
        );

        const providerResponse = await provider.sendMessage(
          delivery.destination,
          content,
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
