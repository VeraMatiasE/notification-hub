import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getStartOfCurrentUtcDay } from 'src/common/utils/utc-date.util';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessageRateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUserDailyLimit(userId: number): Promise<void> {
    const startOfDay = getStartOfCurrentUtcDay();

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        dailyLimit: true,
      },
    });

    if (!user) {
      return;
    }

    const messagesSentToday = await this.prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (messagesSentToday >= user.dailyLimit) {
      throw new HttpException(
        'Daily message limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
