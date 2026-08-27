import type { PrismaClient } from "../../generated/prisma/client.js";
import type { Generation } from "../../domain/entities/Generation.js";
import type { GenerationRepository, NewGeneration } from "../../application/ports/GenerationRepository.js";

export class PrismaGenerationRepository implements GenerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(data: NewGeneration): Promise<Generation> {
    return this.prisma.generation.create({ data });
  }

  async getRecent(limit: number): Promise<Generation[]> {
    return this.prisma.generation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
