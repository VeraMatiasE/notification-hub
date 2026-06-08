import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getStartOfCurrentUtcDay } from 'src/common/utils/utc-date.util';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessageRateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserCanSendMessage(userId: number): Promise<void> {
    const startOfDay = getStartOfCurrentUtcDay();

    const [user, messagesSentToday] = await Promise.all([
      this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          dailyLimit: true,
        },
      }),
      this.prisma.message.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
          },
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (messagesSentToday >= user.dailyLimit) {
      throw new HttpException(
        {
          message: 'Daily message limit exceeded',
          limit: user.dailyLimit,
          used: messagesSentToday,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
