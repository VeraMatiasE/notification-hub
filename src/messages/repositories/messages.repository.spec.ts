import { MessagesRepository } from './messages.repository';
import { Status } from 'src/generated/prisma/client';

describe('MessagesRepository', () => {
  let repository: MessagesRepository;

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

    repository = new MessagesRepository(mockPrismaService as any);
  });

  describe('createMessage', () => {
    it('should call prisma.message.create with correct data', async () => {
      const content = 'hello';
      const userId = 1;

      const expected = { id: 1, content };

      mockPrismaService.message.create.mockResolvedValue(expected);

      const result = await repository.createMessage(content, userId);

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          content,
          userId,
        },
      });

      expect(result).toEqual(expected);
    });
  });

  describe('getActiveProviders', () => {
    it('should return active providers', async () => {
      const expected = [{ id: 1, name: 'DISCORD', isActive: true }];

      mockPrismaService.messageProvider.findMany.mockResolvedValue(expected);

      const result = await repository.getActiveProviders();

      expect(mockPrismaService.messageProvider.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
      });

      expect(result).toEqual(expected);
    });
  });

  describe('createDeliveries', () => {
    it('should call createMany with data', async () => {
      const data = [
        {
          messageId: 1,
          destination: 'general',
          messageProviderId: 2,
          status: Status.PENDING,
        },
      ];

      mockPrismaService.messageDelivery.createMany.mockResolvedValue({
        count: 1,
      });

      const result = await repository.createDeliveries(data);

      expect(mockPrismaService.messageDelivery.createMany).toHaveBeenCalledWith(
        {
          data,
        },
      );

      expect(result).toEqual({ count: 1 });
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery by id', async () => {
      const deliveryId = 1;

      const data = {
        status: Status.SUCCESS,
      };

      const expected = { id: 1, status: Status.SUCCESS };

      mockPrismaService.messageDelivery.update.mockResolvedValue(expected);

      const result = await repository.updateDeliveryStatus(deliveryId, data);

      expect(mockPrismaService.messageDelivery.update).toHaveBeenCalledWith({
        where: {
          id: deliveryId,
        },
        data,
      });

      expect(result).toEqual(expected);
    });
  });

  describe('getDeliveriesByMessageId', () => {
    it('should find deliveries by messageId', async () => {
      const messageId = 10n;

      const expected = [
        {
          id: 1,
          messageId: 10n,
          messageProvider: { name: 'DISCORD' },
        },
      ];

      mockPrismaService.messageDelivery.findMany.mockResolvedValue(expected);

      const result = await repository.getDeliveriesByMessageId(messageId);

      expect(mockPrismaService.messageDelivery.findMany).toHaveBeenCalledWith({
        where: {
          messageId,
        },
        include: {
          messageProvider: true,
        },
      });

      expect(result).toEqual(expected);
    });
  });

  describe('getMessagesByUserId', () => {
    it('should build filters correctly', async () => {
      const userId = 1;

      const filters = {
        from: '2024-01-01',
        to: '2024-12-31',
        status: Status.SUCCESS,
        provider: 'DISCORD',
      };

      const expected = [{ id: 1 }];

      mockPrismaService.messageDelivery.findMany.mockResolvedValue(expected);

      const result = await repository.getMessagesByUserId(
        userId,
        filters as any,
      );

      expect(mockPrismaService.messageDelivery.findMany).toHaveBeenCalledWith({
        where: {
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
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(expected);
    });

    it('should build minimal filter when no filters provided', async () => {
      const userId = 1;

      mockPrismaService.messageDelivery.findMany.mockResolvedValue([]);

      await repository.getMessagesByUserId(userId, {} as any);

      expect(mockPrismaService.messageDelivery.findMany).toHaveBeenCalledWith({
        where: {
          message: {
            userId,
          },
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
