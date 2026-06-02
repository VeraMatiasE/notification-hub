import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma.service';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  describe('getUsersMetrics', () => {
    it('should calculate user metrics correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 1,
          username: 'user',
          dailyLimit: 100,
          _count: {
            messageId: 50,
          },
          messageId: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
          })),
        },
      ]);

      const result = await service.getUsersMetrics();

      expect(result).toEqual([
        {
          userId: 1,
          username: 'user',
          totalMessagesSent: 50,
          remainingMessagesToday: 80,
        },
      ]);
    });

    it('should return zero remaining messages when daily limit is exceeded', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 1,
          username: 'user',
          dailyLimit: 10,
          _count: {
            messageId: 100,
          },
          messageId: Array.from({ length: 25 }, (_, index) => ({
            id: index + 1,
          })),
        },
      ]);

      const result = await service.getUsersMetrics();

      expect(result).toEqual([
        {
          userId: 1,
          username: 'user',
          totalMessagesSent: 100,
          remainingMessagesToday: 0,
        },
      ]);
    });

    it('should return metrics for multiple users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 1,
          username: 'user',
          dailyLimit: 100,
          _count: {
            messageId: 40,
          },
          messageId: Array.from({ length: 15 }, (_, index) => ({
            id: index + 1,
          })),
        },
        {
          id: 2,
          username: 'user2',
          dailyLimit: 50,
          _count: {
            messageId: 25,
          },
          messageId: Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
          })),
        },
      ]);

      const result = await service.getUsersMetrics();

      expect(result).toEqual([
        {
          userId: 1,
          username: 'user',
          totalMessagesSent: 40,
          remainingMessagesToday: 85,
        },
        {
          userId: 2,
          username: 'user2',
          totalMessagesSent: 25,
          remainingMessagesToday: 40,
        },
      ]);
    });

    it('should return an empty array when there are no users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getUsersMetrics();

      expect(result).toEqual([]);
    });
  });
});
