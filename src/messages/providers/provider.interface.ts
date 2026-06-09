import { ProviderSendMessageResponse } from '../types/provider-response.type';

export interface ProviderChannel {
  name: string;
  destination: string;
  isActive: boolean;
}

export interface ProviderInterface {
  sendMessage(
    destination: string,
    content: string,
  ): Promise<ProviderSendMessageResponse>;

  loadChannels(channels: ProviderChannel[]): void;
}
