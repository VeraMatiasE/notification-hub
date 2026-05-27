import { Prisma } from 'src/generated/prisma/client';

export type ProviderSendMessageResponse = {
  sentAt?: Date;
  raw: Prisma.InputJsonValue;
};
