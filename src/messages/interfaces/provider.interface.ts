import { ProviderSendMessageResponse } from '../types/provider-response.type';

export interface ProviderInterface {
  sendMessage(
    destination: string,
    content: string,
  ): Promise<ProviderSendMessageResponse>;
}
