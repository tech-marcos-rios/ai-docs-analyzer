import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env.js";
import type { AiProvider } from "../../application/ports/AiProvider.js";
import { ClaudeProvider } from "./ClaudeProvider.js";

/**
 * Composition root del proveedor de IA. Agregar un proveedor nuevo:
 * 1. Implementar `AiProvider` en infrastructure/providers/<Nombre>Provider.ts
 * 2. Sumar el case acá — el resto de la app (services, routes) no cambia.
 */
export function getAiProvider(): AiProvider {
  switch (env.AI_PROVIDER) {
    case "claude":
      return new ClaudeProvider(new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }));
    case "openai":
      throw new Error("AI_PROVIDER=openai todavía no está implementado.");
    case "gemini":
      throw new Error("AI_PROVIDER=gemini todavía no está implementado.");
  }
}
