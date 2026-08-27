import { z } from "zod";

export const toneOptions = ["formal", "casual", "divertido"] as const;

export const generateCopyRequestSchema = z.object({
  productName: z.string().trim().min(2).max(120),
  features: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  tone: z.enum(toneOptions),
  language: z.string().trim().min(2).max(20),
});

export type GenerateCopyRequest = z.infer<typeof generateCopyRequestSchema>;
