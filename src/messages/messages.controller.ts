import {
  Body,
  Controller,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MessagesDTO } from './messages.dto';
import { MessagesService } from './messages.service';
import { CurrentUser } from './decorator/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessage(
    @Body() messageDto: MessagesDTO,
    @CurrentUser('id') userId: number,
  ) {
    return await this.messageService.sendMessagesToProviders(
      messageDto,
      userId,
    );
  }
}
