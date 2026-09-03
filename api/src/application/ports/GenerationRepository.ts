import type { Generation } from "../../domain/entities/Generation.js";

export type ReservationInput = Pick<
  Generation,
  "clientId" | "productName" | "features" | "tone" | "language"
>;

export type GenerationResult = Pick<Generation, "generatedText" | "provider" | "model" | "tokensUsed">;

export interface GenerationRepository {
  /**
   * Chequea el tope diario y reserva un lugar en una sola operación atómica —
   * evita la carrera de "contar, generar con la IA, recién ahí guardar" que
   * permitía pasarse del límite con requests concurrentes (ver
   * PrismaGenerationRepository para el detalle del locking). Devuelve el id
   * de la fila reservada, o null si ya se alcanzó `limit`.
   */
  reserveSlot(input: ReservationInput, since: Date, limit: number): Promise<string | null>;
  /** Completa una reserva con el contenido real ya generado. */
  finalize(id: string, result: GenerationResult): Promise<Generation>;
  /** Libera una reserva que no llegó a generar contenido (falla o vacío). */
  discard(id: string): Promise<void>;
  getRecent(clientId: string, limit: number): Promise<Generation[]>;
}
