import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesRepository } from '../repositories/messages.repository';
import { MessageRateLimitService } from '../services/message-rate-limit.service';
import { MessageDeliveryService } from './message-delivery.service';
import { ProvidersName } from '../dto/send-message.dto';
import { Status } from 'src/generated/prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockMessagesRepository = {
    createMessage: jest.fn(),
    getActiveProviders: jest.fn(),
    createDeliveries: jest.fn(),
    getDeliveriesByMessageId: jest.fn(),
    getMessagesByUserId: jest.fn(),
  };

  const mockMessageRateLimitService = {
    validateUserDailyLimit: jest.fn(),
  };

  const mockMessageDeliveryService = {
    processDeliveries: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useValue: mockMessagesRepository,
        },
        {
          provide: MessageRateLimitService,
          useValue: mockMessageRateLimitService,
        },
        {
          provide: MessageDeliveryService,
          useValue: mockMessageDeliveryService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('sendMessagesToProviders', () => {
    it('should send messages successfully', async () => {
      const userId = 1;

      const messageDto = {
        content: 'Hello world',
        providers: [
          {
            name: ProvidersName.DISCORD,
            destination: 'general',
          },
        ],
      };

      mockMessagesRepository.createMessage.mockResolvedValue({
        id: 1,
      });

      mockMessagesRepository.getActiveProviders.mockResolvedValue([
        {
          id: 10,
          name: ProvidersName.DISCORD,
        },
      ]);

      mockMessagesRepository.createDeliveries.mockResolvedValue(undefined);

      mockMessagesRepository.getDeliveriesByMessageId.mockResolvedValue([
        {
          id: 100,
          destination: 'general',
          messageProvider: {
            name: ProvidersName.DISCORD,
          },
        },
      ]);

      mockMessageDeliveryService.processDeliveries.mockResolvedValue([
        {
          deliveryId: '100',
          provider: ProvidersName.DISCORD,
          destination: 'general',
          status: Status.SUCCESS,
        },
      ]);

      const result = await service.sendMessagesToProviders(messageDto, userId);

      expect(
        mockMessageRateLimitService.validateUserDailyLimit,
      ).toHaveBeenCalledWith(userId);

      expect(mockMessagesRepository.createMessage).toHaveBeenCalledWith(
        'Hello world',
        userId,
      );

      expect(mockMessagesRepository.createDeliveries).toHaveBeenCalled();

      expect(mockMessageDeliveryService.processDeliveries).toHaveBeenCalled();

      expect(result).toEqual({
        messageId: '1',
        deliveries: [
          {
            deliveryId: '100',
            provider: ProvidersName.DISCORD,
            destination: 'general',
            status: Status.SUCCESS,
          },
        ],
      });
    });

    it('should throw BadRequestException when provider does not exist', async () => {
      const messageDto = {
        content: 'Hello world',
        providers: [
          {
            name: ProvidersName.DISCORD,
            destination: 'general',
          },
        ],
      };

      mockMessagesRepository.createMessage.mockResolvedValue({
        id: 1,
      });

      mockMessagesRepository.getActiveProviders.mockResolvedValue([]);

      await expect(
        service.sendMessagesToProviders(messageDto, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMessagesByUserId', () => {
    it('should return user messages', async () => {
      const filters = {
        query: 'hello',
      };

      const expectedMessages = [
        {
          id: 1,
          content: 'hello world',
        },
      ];

      mockMessagesRepository.getMessagesByUserId.mockResolvedValue(
        expectedMessages,
      );

      const result = await service.getMessagesByUserId(1, filters);

      expect(mockMessagesRepository.getMessagesByUserId).toHaveBeenCalledWith(
        1,
        filters,
      );

      expect(result).toEqual(expectedMessages);
    });
  });
});
