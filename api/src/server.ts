import { env } from "./config/env.js";
import { logger } from "./infrastructure/logging/logger.js";
import { createApp } from "./api/app.js";
import { getAiProvider } from "./infrastructure/providers/getAiProvider.js";
import { prisma } from "./infrastructure/persistence/prismaClient.js";
import { PrismaGenerationRepository } from "./infrastructure/persistence/PrismaGenerationRepository.js";
import { GenerateCopyService } from "./application/services/GenerateCopyService.js";

const aiProvider = getAiProvider();
const generationRepository = new PrismaGenerationRepository(prisma);
const generateCopyService = new GenerateCopyService(aiProvider, generationRepository);

const app = createApp({ generateCopyService, generationRepository });

const server = app.listen(env.PORT, () => {
  logger.info(`ai-docs-analyzer API listening on port ${env.PORT} (provider: ${aiProvider.name})`);
});

async function shutdown(): Promise<void> {
  logger.info("Shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
