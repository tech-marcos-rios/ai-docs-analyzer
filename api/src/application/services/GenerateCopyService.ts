import { Result } from "../common/Result.js";
import { GLOBAL_DAILY_GENERATION_LIMIT, MAX_OUTPUT_TOKENS } from "../common/constants.js";
import type { GenerateCopyRequest } from "../dtos/GenerateCopyRequest.js";
import type { AiProvider } from "../ports/AiProvider.js";
import type { GenerationRepository } from "../ports/GenerationRepository.js";
import { buildCopyPrompt } from "./promptBuilder.js";
import type { Generation } from "../../domain/entities/Generation.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class GenerateCopyService {
  constructor(
    private readonly aiProvider: AiProvider,
    private readonly generationRepository: GenerationRepository,
  ) {}

  /**
   * Chequea el tope diario global Y reserva el lugar en la misma operación
   * atómica (ver GenerationRepository.reserveSlot) — separado de `generate()`
   * para que la ruta pueda responder un 429 normal antes de abrir el stream
   * SSE. A diferencia de un simple "contar y despues guardar", acá el
   * conteo y la reserva son indivisibles, así que no hay ventana en la que
   * dos requests concurrentes lean el mismo conteo y pasen los dos.
   */
  async reserveSlot(request: GenerateCopyRequest, clientId: string): Promise<Result<string>> {
    const since = new Date(Date.now() - ONE_DAY_MS);
    const id = await this.generationRepository.reserveSlot(
      {
        clientId,
        productName: request.productName,
        features: request.features,
        tone: request.tone,
        language: request.language,
      },
      since,
      GLOBAL_DAILY_GENERATION_LIMIT,
    );

    if (id === null) {
      return Result.failure(
        "Se alcanzó el límite diario global de generaciones de esta demo. Probá de nuevo más tarde.",
      );
    }
    return Result.success(id);
  }

  async generate(
    reservationId: string,
    request: GenerateCopyRequest,
    onChunk: (text: string) => void,
  ): Promise<Result<Generation>> {
    try {
      const prompt = buildCopyPrompt(request);
      const stream = this.aiProvider.generateStream(prompt, MAX_OUTPUT_TOKENS);

      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.text;
        onChunk(chunk.text);
      }

      if (fullText.trim().length === 0) {
        await this.generationRepository.discard(reservationId);
        return Result.failure("El modelo no generó contenido.");
      }

      const usage = await stream.getUsage();
      const generation = await this.generationRepository.finalize(reservationId, {
        generatedText: fullText,
        provider: this.aiProvider.name,
        model: usage.model,
        tokensUsed: usage.tokensUsed,
      });

      return Result.success(generation);
    } catch (err) {
      await this.generationRepository.discard(reservationId);
      throw err;
    }
  }
}
