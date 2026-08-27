import { Router } from "express";
import { generateCopyRequestSchema } from "../../application/dtos/GenerateCopyRequest.js";
import type { GenerateCopyService } from "../../application/services/GenerateCopyService.js";
import { perDayLimiter, perMinuteLimiter } from "../middleware/rateLimiter.js";
import { logger } from "../../infrastructure/logging/logger.js";

export function generateRoutes(generateCopyService: GenerateCopyService): Router {
  const router = Router();

  router.post("/generate", perMinuteLimiter, perDayLimiter, async (req, res, next) => {
    const parsed = generateCopyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    // SSE: una vez que se envían los headers, cualquier error se comunica
    // como evento "error" dentro del stream, no como respuesta HTTP de error.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const result = await generateCopyService.generate(parsed.data, (chunk) => {
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      });

      if (result.isSuccess && result.value) {
        res.write(`event: done\ndata: ${JSON.stringify({ id: result.value.id })}\n\n`);
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: result.error })}\n\n`);
      }
    } catch (err) {
      logger.error({ err }, "Error streaming generation");
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: "Error generando el contenido." })}\n\n`,
      );
    } finally {
      res.end();
    }
  });

  return router;
}
