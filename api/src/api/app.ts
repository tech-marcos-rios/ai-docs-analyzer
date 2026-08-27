import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";
import { logger } from "../infrastructure/logging/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generateRoutes } from "./routes/generate.routes.js";
import { historyRoutes } from "./routes/history.routes.js";
import type { GenerateCopyService } from "../application/services/GenerateCopyService.js";
import type { GenerationRepository } from "../application/ports/GenerationRepository.js";

interface Dependencies {
  generateCopyService: GenerateCopyService;
  generationRepository: GenerationRepository;
}

export function createApp({ generateCopyService, generationRepository }: Dependencies): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api", generateRoutes(generateCopyService));
  app.use("/api", historyRoutes(generationRepository));

  app.use(errorHandler);

  return app;
}
