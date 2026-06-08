-- CreateTable
CREATE TABLE "ProviderChannel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" INTEGER NOT NULL,

    CONSTRAINT "ProviderChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderChannel_providerId_isActive_idx" ON "ProviderChannel"("providerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderChannel_providerId_name_key" ON "ProviderChannel"("providerId", "name");

-- AddForeignKey
ALTER TABLE "ProviderChannel" ADD CONSTRAINT "ProviderChannel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MessageProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
