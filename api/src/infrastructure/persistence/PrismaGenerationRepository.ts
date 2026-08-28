import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Generation } from "../../domain/entities/Generation.js";
import type { GenerationRepository, NewGeneration } from "../../application/ports/GenerationRepository.js";

export class PrismaGenerationRepository implements GenerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(data: NewGeneration): Promise<Generation> {
    return this.prisma.generation.create({ data });
  }

  async getRecent(clientId: string, limit: number): Promise<Generation[]> {
    return this.prisma.generation.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async countSince(since: Date): Promise<number> {
    return this.prisma.generation.count({
      where: { createdAt: { gte: since } },
    });
  }
}
