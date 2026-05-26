import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { UserMetricsDto } from './user-metrics.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersMetrics(): Promise<UserMetricsDto[]> {
    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            messageId: true,
          },
        },
        messageId: {
          where: {
            createdAt: {
              gte: startOfDay,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    return users.map((user) => {
      const messagesSentToday = user.messageId.length;

      return {
        userId: user.id,
        username: user.username,
        totalMessagesSent: user._count.messageId,
        remainingMessagesToday: Math.max(
          user.dailyLimit - messagesSentToday,
          0,
        ),
      };
    });
  }
}
