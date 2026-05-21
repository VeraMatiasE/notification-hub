import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MessagesDTO } from './messages.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendMessage(@Body() messageDto: MessagesDTO) {
    await this.messageService.sendMessagesToProviders(messageDto);
  }
}
