import { z } from "zod";

export const toneOptions = ["formal", "casual", "divertido"] as const;

export const generateFormSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  features: z
    .array(
      z.object({
        value: z.string().trim().min(1, "No puede estar vacío").max(80, "Máximo 80 caracteres"),
      }),
    )
    .min(1, "Agregá al menos una característica")
    .max(10, "Máximo 10 características"),
  tone: z.enum(toneOptions),
  language: z.string().trim().min(2, "Mínimo 2 caracteres").max(20, "Máximo 20 caracteres"),
});

export type GenerateFormValues = z.infer<typeof generateFormSchema>;
