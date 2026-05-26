import { BadRequestException, Injectable } from '@nestjs/common';
import { MessagesDTO, ProvidersName } from './messages.dto';
import { ProviderFactory } from './provider.factory';
import { ProviderInterface } from './interfaces/provider.interface';
import { PrismaService } from 'src/database/prisma.service';
import { Status } from 'generated/prisma/browser';
import { GetMessagesFiltersDto } from './dto/filter.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly prismaService: PrismaService,
  ) {}

  async getMessagesByUserId(userId: number, filters: GetMessagesFiltersDto) {
    const messageWhere: Prisma.MessageWhereInput = {
      userId,
    };

    if (filters.from || filters.to) {
      messageWhere.createdAt = {
        ...(filters.from && {
          gte: new Date(filters.from),
        }),
        ...(filters.to && {
          lte: new Date(filters.to),
        }),
      };
    }

    const whereClause: Prisma.MessageDeliveryWhereInput = {
      message: messageWhere,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.provider) {
      whereClause.messageProvider = {
        name: filters.provider,
      };
    }

    return await this.prismaService.messageDelivery.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        destination: true,
        status: true,
        sentAt: true,
        providerResponse: true,
        errorMessage: true,
        updatedAt: true,

        message: {
          select: {
            content: true,
            createdAt: true,
          },
        },

        messageProvider: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async sendMessagesToProviders(messageDto: MessagesDTO, userId: number) {
    const content = messageDto.content;

    const message = await this.prismaService.message.create({
      data: {
        content,
        userId,
      },
    });

    const providers = await this.prismaService.messageProvider.findMany({
      where: {
        isActive: true,
      },
      select: {
        createdAt: false,
        isActive: false,
        id: true,
        name: true,
      },
    });

    const providersMap: ReadonlyMap<string, number> = new Map<string, number>(
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

    await this.prismaService.messageDelivery.createMany({
      data: deliveriesData,
    });

    const createdDeliveries = await this.prismaService.messageDelivery.findMany(
      {
        where: {
          messageId: message.id,
        },
        include: {
          messageProvider: true,
        },
      },
    );

    const tasks = createdDeliveries.map(async (delivery) => {
      try {
        const provider: ProviderInterface = this.providerFactory.getProvider(
          delivery.messageProvider.name as ProvidersName,
        );
        const providerResponse = await provider.sendMessage(
          delivery.destination,
          content,
        );

        await this.prismaService.messageDelivery.update({
          where: {
            id: delivery.id,
          },
          data: {
            status: Status.SUCCESS,
            sentAt: new Date(),
            providerResponse,
          },
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

        await this.prismaService.messageDelivery.update({
          where: {
            id: delivery.id,
          },
          data: {
            status: Status.FAILED,
            errorMessage,
          },
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

    const results = await Promise.all(tasks);

    return {
      messageId: message.id.toString(),
      deliveries: results,
    };
  }
}
