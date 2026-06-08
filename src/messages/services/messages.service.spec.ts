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
    createMessageWithDeliveries: jest.fn(),
    getActiveProviders: jest.fn(),
    createDeliveries: jest.fn(),
    getDeliveriesByMessageId: jest.fn(),
    getMessagesByUserId: jest.fn(),
  };

  const mockMessageRateLimitService = {
    ensureUserCanSendMessage: jest.fn(),
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
      const mockUsername = 'test';

      const messageDto = {
        content: 'Hello world',
        providers: [
          {
            name: ProvidersName.DISCORD,
            destination: 'general',
          },
        ],
      };

      mockMessagesRepository.createMessageWithDeliveries.mockResolvedValue({
        message: {
          content: messageDto.content,
          id: 1,
        },
        deliveries: undefined,
      });

      mockMessagesRepository.getActiveProviders.mockResolvedValue([
        {
          id: 10,
          name: ProvidersName.DISCORD,
        },
      ]);

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
          provider: ProvidersName.DISCORD,
          destination: 'general',
          status: Status.SUCCESS,
        },
      ]);

      const result = await service.sendMessagesToProviders(
        messageDto,
        userId,
        mockUsername,
      );

      expect(
        mockMessageRateLimitService.ensureUserCanSendMessage,
      ).toHaveBeenCalledWith(userId);

      expect(result).toEqual({
        content: messageDto.content,
        createdAt: undefined,
        deliveries: [
          {
            provider: ProvidersName.DISCORD,
            destination: 'general',
            status: Status.SUCCESS,
          },
        ],
      });
    });
  });
});
