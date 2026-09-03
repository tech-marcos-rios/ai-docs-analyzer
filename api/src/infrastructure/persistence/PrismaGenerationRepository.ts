import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Generation } from "../../domain/entities/Generation.js";
import type {
  GenerationRepository,
  GenerationResult,
  ReservationInput,
} from "../../application/ports/GenerationRepository.js";

// Clave arbitraria pero estable para el advisory lock de Postgres — solo
// sirve para no chocar con locks de otra feature que use la misma técnica.
const DAILY_CAP_LOCK_KEY = "ai-docs-analyzer:daily-generation-cap";

export class PrismaGenerationRepository implements GenerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async reserveSlot(input: ReservationInput, since: Date, limit: number): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      // pg_advisory_xact_lock serializa SOLO este chequeo+insert (dura
      // milisegundos), no la llamada lenta a la IA que viene después —
      // dos requests concurrentes ya no pueden leer el mismo conteo y
      // pasar los dos el chequeo antes de que cualquiera haya insertado.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${DAILY_CAP_LOCK_KEY}))`;

      const count = await tx.generation.count({
        where: { createdAt: { gte: since } },
      });
      if (count >= limit) return null;

      // Placeholder: generatedText vacío marca "reservado, generación en
      // curso" — cuenta para el tope apenas se crea, sin esperar a que
      // termine el streaming. getRecent() filtra estas filas si alguien
      // pide su historial mientras todavía están en curso.
      const placeholder = await tx.generation.create({
        data: { ...input, generatedText: "", provider: "", model: "", tokensUsed: 0 },
      });
      return placeholder.id;
    });
  }

  async finalize(id: string, result: GenerationResult): Promise<Generation> {
    return this.prisma.generation.update({ where: { id }, data: result });
  }

  async discard(id: string): Promise<void> {
    await this.prisma.generation.delete({ where: { id } });
  }

  async getRecent(clientId: string, limit: number): Promise<Generation[]> {
    return this.prisma.generation.findMany({
      where: { clientId, generatedText: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
