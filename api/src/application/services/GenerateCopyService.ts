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
   * Chequeo previo a llamar a la IA — corta el request si se superó el tope
   * global diario, sin gastar tokens. Separado de `generate()` para que la
   * ruta pueda responder un 429 normal antes de abrir el stream SSE.
   */
  async checkGlobalCapacity(): Promise<Result<void>> {
    const since = new Date(Date.now() - ONE_DAY_MS);
    const count = await this.generationRepository.countSince(since);

    if (count >= GLOBAL_DAILY_GENERATION_LIMIT) {
      return Result.failure(
        "Se alcanzó el límite diario global de generaciones de esta demo. Probá de nuevo más tarde.",
      );
    }
    return Result.success(undefined);
  }

  async generate(
    request: GenerateCopyRequest,
    clientId: string,
    onChunk: (text: string) => void,
  ): Promise<Result<Generation>> {
    const prompt = buildCopyPrompt(request);
    const stream = this.aiProvider.generateStream(prompt, MAX_OUTPUT_TOKENS);

    let fullText = "";
    for await (const chunk of stream) {
      fullText += chunk.text;
      onChunk(chunk.text);
    }

    if (fullText.trim().length === 0) {
      return Result.failure("El modelo no generó contenido.");
    }

    const usage = await stream.getUsage();

    const generation = await this.generationRepository.save({
      clientId,
      productName: request.productName,
      features: request.features,
      tone: request.tone,
      language: request.language,
      generatedText: fullText,
      provider: this.aiProvider.name,
      model: usage.model,
      tokensUsed: usage.tokensUsed,
    });

    return Result.success(generation);
  }
}
