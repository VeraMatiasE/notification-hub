import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { MessageRateLimitService } from './message-rate-limit.service';

describe('MessageRateLimitService', () => {
  let service: MessageRateLimitService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageRateLimitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MessageRateLimitService>(MessageRateLimitService);
  });

  describe('validateUserDailyLimit', () => {
    it('should do thrown an exception when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.ensureUserCanSendMessage(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow sending messages when daily limit is not reached', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dailyLimit: 10,
      });

      mockPrismaService.message.count.mockResolvedValue(5);

      await expect(
        service.ensureUserCanSendMessage(1),
      ).resolves.toBeUndefined();
    });

    it('should throw when daily limit is reached', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        dailyLimit: 10,
      });

      mockPrismaService.message.count.mockResolvedValue(10);

      await expect(service.ensureUserCanSendMessage(1)).rejects.toThrow(
        HttpException,
      );

      await expect(service.ensureUserCanSendMessage(1)).rejects.toMatchObject({
        message: 'Daily message limit exceeded',
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });
  });
});
