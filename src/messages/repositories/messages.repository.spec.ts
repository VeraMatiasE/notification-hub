import { PrismaService } from 'src/database/prisma.service';
import { MessagesRepository } from './messages.repository';
import { Status } from 'src/generated/prisma/client';

describe('MessagesRepository', () => {
  let repository: MessagesRepository;

  type FindManyArgs = {
    where: unknown;
    orderBy: unknown;
  };

  const mockPrismaService = {
    message: {
      create: jest.fn(),
    },
    messageDelivery: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    messageProvider: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    repository = new MessagesRepository(
      mockPrismaService as unknown as PrismaService,
    );
  });

  describe('getMessagesByUserId', () => {
    it('should apply all filters when provided', async () => {
      const userId = 1;

      const filters = {
        from: '2024-01-01',
        to: '2024-12-31',
        status: Status.SUCCESS,
        provider: 'DISCORD',
      };

      mockPrismaService.messageDelivery.findMany.mockResolvedValue([]);

      await repository.getMessagesByUserId(userId, filters);

      const calls = mockPrismaService.messageDelivery.findMany.mock.calls as [
        FindManyArgs,
      ][];
      const query = calls[0]?.[0];

      expect(query.where).toEqual({
        message: {
          userId,
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        status: Status.SUCCESS,
        messageProvider: {
          name: 'DISCORD',
        },
      });

      expect(query.orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it('should only filter by user when no optional filters are provided', async () => {
      const userId = 1;

      mockPrismaService.messageDelivery.findMany.mockResolvedValue([]);

      await repository.getMessagesByUserId(userId, {});

      const calls = mockPrismaService.messageDelivery.findMany.mock.calls as [
        FindManyArgs,
      ][];
      const query = calls[0]?.[0];

      expect(query.where).toEqual({
        message: {
          userId,
        },
      });

      expect(query.orderBy).toEqual({
        createdAt: 'desc',
      });
    });

    it('should apply only date filters when provided', async () => {
      const userId = 1;

      mockPrismaService.messageDelivery.findMany.mockResolvedValue([]);

      await repository.getMessagesByUserId(userId, {
        from: '2024-01-01',
        to: '2024-12-31',
      });

      const calls = mockPrismaService.messageDelivery.findMany.mock.calls as [
        FindManyArgs,
      ][];
      const query = calls[0]?.[0];

      expect(query.where).toEqual({
        message: {
          userId,
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
      });
    });
  });
});
