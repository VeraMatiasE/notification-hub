import { Injectable } from '@nestjs/common';
import { MessagesDTO } from './messages.dto';
import { ProviderFactory } from './provider.factory';
import { ProviderInterface } from './interfaces/provider.interface';

@Injectable()
export class MessagesService {
  constructor(private readonly providerFactory: ProviderFactory) {}

  async sendMessagesToProviders(messageDto: MessagesDTO) {
    const content = messageDto.content;

    await Promise.all(
      messageDto.providers.map(async (target) => {
        const provider: ProviderInterface = this.providerFactory.getProvider(
          target.name,
        );
        await provider.sendMessage(target.destination, content);
      }),
    );
  }
}
