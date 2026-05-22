import { Prisma } from 'generated/prisma/browser';

export type ProviderSendMessageResponse = {
  sentAt?: Date;
  raw: Prisma.InputJsonValue;
};
