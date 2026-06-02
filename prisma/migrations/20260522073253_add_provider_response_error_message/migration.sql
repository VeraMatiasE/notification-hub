-- AlterTable
ALTER TABLE "MessageDelivery" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "providerResponse" JSONB;
