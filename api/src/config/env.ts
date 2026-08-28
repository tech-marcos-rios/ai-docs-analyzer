import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(["claude", "openai", "gemini"]).default("claude"),
  PORT: z.coerce.number().default(3000),
  // Cantidad de hops de reverse proxy a confiar para X-Forwarded-For (rate limiting por IP real).
  // 0 en local (conexión directa). En Hetzner detrás de Nginx/Cloudflare, poner 1.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
