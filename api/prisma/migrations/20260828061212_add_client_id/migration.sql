/*
  Warnings:

  - Added the required column `clientId` to the `Generation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "clientId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Generation_clientId_createdAt_idx" ON "Generation"("clientId", "createdAt");
