import { z } from "zod";
import type { Request } from "express";

const clientIdSchema = z
  .string()
  .trim()
  .min(1, "Falta el header X-Client-Id")
  .max(100, "X-Client-Id demasiado largo");

/**
 * Identificador anónimo generado por el frontend (localStorage, no auth real)
 * usado para que cada visitante solo vea su propio historial. Ver CLAUDE.md.
 */
export function parseClientId(req: Request) {
  return clientIdSchema.safeParse(req.header("x-client-id") ?? "");
}
