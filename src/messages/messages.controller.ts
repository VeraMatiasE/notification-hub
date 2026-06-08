import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './services/messages.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetMessagesFiltersDto } from './dto/get-messages-filters.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SendMessageResponseDto } from './dto/response.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { PERMISSIONS } from 'src/common/constants/permissions.constants';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.MESSAGES_LIST)
  @ApiOperation({
    summary: 'Get user messages',
    description: 'Returns messages belonging to the authenticated user.',
  })
  @ApiBody({
    type: LoginDto,
  })
  @ApiOkResponse({
    description: 'Messages retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT',
  })
  async getMessages(
    @CurrentUser('id') userId: number,
    @Query() filters: GetMessagesFiltersDto,
  ) {
    return await this.messageService.getMessagesByUserId(userId, filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.MESSAGES_SEND)
  @ApiOperation({
    summary: 'Send message',
    description:
      'Creates a message and sends it through the selected providers.',
  })
  @ApiBody({
    type: SendMessageDto,
    description: 'Message payload with providers and content',
  })
  @ApiCreatedResponse({
    description: 'Message sent and deliveries processed',
    type: SendMessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid provider name or request payload',
  })
  @ApiTooManyRequestsResponse({
    description: 'Daily message limit reached',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT',
  })
  async sendMessages(
    @Body() messageDto: SendMessageDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('username') username: string,
  ) {
    return await this.messageService.sendMessagesToProviders(
      messageDto,
      userId,
      username,
    );
  }
}
