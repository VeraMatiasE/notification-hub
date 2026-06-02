import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './services/messages.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetMessagesFiltersDto } from './dto/get-messages-filters.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMessages(
    @CurrentUser('id') userId: number,
    @Query() filters: GetMessagesFiltersDto,
  ) {
    return await this.messageService.getMessagesByUserId(userId, filters);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessages(
    @Body() messageDto: SendMessageDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.messageService.sendMessagesToProviders(
      messageDto,
      userId,
    );
  }
}
