import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MessagesDTO } from './messages.dto';
import { MessagesService } from './messages.service';
import { CurrentUser } from './decorator/current-user.decorator';
import { GetMessagesFiltersDto } from './dto/filter.dto';

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
    @Body() messageDto: MessagesDTO,
    @CurrentUser('id') userId: number,
  ) {
    return await this.messageService.sendMessagesToProviders(
      messageDto,
      userId,
    );
  }
}
