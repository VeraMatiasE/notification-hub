import { Test, TestingModule } from '@nestjs/testing';
import { MessageDeliveryService } from './message-delivery.service';
import { ProviderFactory } from '../providers/provider.factory';
import { MessagesRepository } from '../repositories/messages.repository';
import { Status } from 'src/generated/prisma/client';
import { ProvidersName } from '../dto/send-message.dto';

describe('MessageDeliveryService', () => {
  let service: MessageDeliveryService;

  const mockProvider = {
    sendMessage: jest.fn(),
  };

  const mockProviderFactory = {
    getProvider: jest.fn(),
  };

  const mockMessagesRepository = {
    updateDeliveryStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageDeliveryService,
        {
          provide: ProviderFactory,
          useValue: mockProviderFactory,
        },
        {
          provide: MessagesRepository,
          useValue: mockMessagesRepository,
        },
      ],
    }).compile();

    service = module.get<MessageDeliveryService>(MessageDeliveryService);
  });

  describe('processDeliveries', () => {
    it('should process delivery successfully', async () => {
      const delivery = {
        id: 1n,
        destination: 'general',
        messageProvider: {
          name: ProvidersName.DISCORD,
        },
      };

      const content = 'Hello world';

      mockProviderFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.sendMessage.mockResolvedValue('ok');
      mockMessagesRepository.updateDeliveryStatus.mockResolvedValue(undefined);

      const result = await service.processDeliveries([delivery], content);

      expect(mockMessagesRepository.updateDeliveryStatus).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          status: Status.SUCCESS,
          providerResponse: 'ok',
        }),
      );

      expect(result).toEqual([
        {
          deliveryId: '1',
          provider: ProvidersName.DISCORD,
          destination: 'general',
          status: Status.SUCCESS,
        },
      ]);
    });

    it('should handle provider failure', async () => {
      const delivery = {
        id: 2n,
        destination: 'general',
        messageProvider: {
          name: ProvidersName.DISCORD,
        },
      };

      const content = 'Hello world';

      mockProviderFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.sendMessage.mockRejectedValue(new Error('Provider failed'));
      mockMessagesRepository.updateDeliveryStatus.mockResolvedValue(undefined);

      const result = await service.processDeliveries([delivery], content);

      expect(mockMessagesRepository.updateDeliveryStatus).toHaveBeenCalledWith(
        2n,
        expect.objectContaining({
          status: Status.FAILED,
          errorMessage: 'Provider failed',
        }),
      );

      expect(result).toEqual([
        {
          deliveryId: '2',
          provider: ProvidersName.DISCORD,
          destination: 'general',
          status: Status.FAILED,
          errorMessage: 'Provider failed',
        },
      ]);
    });

    it('should process multiple deliveries independently', async () => {
      const deliveries = [
        {
          id: 1n,
          destination: 'general',
          messageProvider: {
            name: ProvidersName.DISCORD,
          },
        },
        {
          id: 2n,
          destination: 'alerts',
          messageProvider: {
            name: ProvidersName.DISCORD,
          },
        },
      ];

      const content = 'Hello world';

      mockProviderFactory.getProvider.mockReturnValue(mockProvider);
      mockProvider.sendMessage
        .mockResolvedValueOnce('ok')
        .mockRejectedValueOnce(new Error('Provider failed'));
      mockMessagesRepository.updateDeliveryStatus.mockResolvedValue(undefined);

      const result = await service.processDeliveries(deliveries, content);

      expect(result).toEqual([
        {
          deliveryId: '1',
          provider: ProvidersName.DISCORD,
          destination: 'general',
          status: Status.SUCCESS,
        },
        {
          deliveryId: '2',
          provider: ProvidersName.DISCORD,
          destination: 'alerts',
          status: Status.FAILED,
          errorMessage: 'Provider failed',
        },
      ]);
    });
  });
});
