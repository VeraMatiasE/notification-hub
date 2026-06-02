import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { GetMessagesFiltersDto } from '../dto/get-messages-filters.dto';

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

  async getActiveProviders() {
    return this.prismaService.messageProvider.findMany({
      where: {
        isActive: true,
      },
    });
  }

  async createDeliveries(data: Prisma.MessageDeliveryCreateManyInput[]) {
    return this.prismaService.messageDelivery.createMany({
      data,
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

  async getDeliveriesByMessageId(messageId: bigint) {
    return this.prismaService.messageDelivery.findMany({
      where: {
        messageId,
      },
      include: {
        messageProvider: true,
      },
    });
  }
}
