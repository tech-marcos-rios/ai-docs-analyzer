import type { ErrorRequestHandler } from "express";
import { logger } from "../../infrastructure/logging/logger.js";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      title: "Validation error",
      errors: err.issues.map((issue) => issue.message),
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    status: 500,
    title: "Internal server error",
  });
};
