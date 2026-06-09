import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, Status } from 'src/generated/prisma/client';
import { GetMessagesFiltersDto } from '../dto/get-messages-filters.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createMessage(content: string, userId: number) {
    return this.prismaService.message.create({
      data: {
        content,
        userId,
      },
    });
  }

  async createMessageWithDeliveries(
    messageDto: SendMessageDto,
    userId: number,
    providersMap: Map<string, number>,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      for (const p of messageDto.providers) {
        if (!providersMap.has(p.name)) {
          throw new BadRequestException(
            `Provider "${p.name}" is not active or does not exist`,
          );
        }
      }

      const message = await tx.message.create({
        data: {
          content: messageDto.content,
          userId,
        },
      });

      const deliveries = messageDto.providers.map((p) => ({
        messageId: message.id,
        messageProviderId: providersMap.get(p.name)!,
        destination: p.destination,
        status: Status.PENDING,
      }));

      await tx.messageDelivery.createMany({ data: deliveries });

      const createdDeliveries = await tx.messageDelivery.findMany({
        where: { messageId: message.id },
        include: {
          messageProvider: {
            include: {
              channels: {
                where: { isActive: true },
                select: { name: true, destination: true, isActive: true },
              },
            },
          },
        },
      });

      return { message, deliveries: createdDeliveries };
    });
  }

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

    const deliveries = await this.prismaService.messageDelivery.findMany({
      where: whereClause,

      select: {
        createdAt: false,
        destination: true,
        status: true,
        sentAt: true,
        providerResponse: false,
        errorMessage: false,
        updatedAt: false,
        messageId: false,

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

    return deliveries.map(
      ({ message, messageProvider, destination, ...delivery }) => ({
        provider: messageProvider.name,
        channel: destination,
        createdAt: message.createdAt,
        ...delivery,
        ...(delivery.status === Status.FAILED && {
          error: 'Delivery failed. Contact support if the issue persists.',
        }),
      }),
    );
  }

  async getActiveProviders() {
    return this.prismaService.messageProvider.findMany({
      where: {
        isActive: true,
      },
    });
  }

  async createDeliveries(data: Prisma.MessageDeliveryCreateManyInput[]) {
    return this.prismaService.messageDelivery.createManyAndReturn({
      data,
      include: { messageProvider: true },
    });
  }

  async updateDeliveryStatus(
    deliveryId: bigint,
    data: Prisma.MessageDeliveryUpdateInput,
  ) {
    return this.prismaService.messageDelivery.update({
      where: {
        id: deliveryId,
      },
      data,
    });
  }
}
