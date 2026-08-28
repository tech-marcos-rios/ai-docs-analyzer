import type { Generation } from "../../domain/entities/Generation.js";

export type NewGeneration = Omit<Generation, "id" | "createdAt">;

export interface GenerationRepository {
  save(data: NewGeneration): Promise<Generation>;
  getRecent(clientId: string, limit: number): Promise<Generation[]>;
  countSince(since: Date): Promise<number>;
}
