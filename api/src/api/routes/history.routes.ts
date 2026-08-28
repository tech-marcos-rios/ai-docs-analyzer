import { Router } from "express";
import { z } from "zod";
import type { GenerationRepository } from "../../application/ports/GenerationRepository.js";
import { perMinuteLimiter } from "../middleware/rateLimiter.js";
import { parseClientId } from "../requestClientId.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export function historyRoutes(generationRepository: GenerationRepository): Router {
  const router = Router();

  router.get("/history", perMinuteLimiter, async (req, res, next) => {
    const clientId = parseClientId(req);
    if (!clientId.success) {
      next(clientId.error);
      return;
    }

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const generations = await generationRepository.getRecent(clientId.data, parsed.data.limit);
    res.json({ generations });
  });

  return router;
}
