-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "features" TEXT[],
    "tone" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Generation_createdAt_idx" ON "Generation"("createdAt");
