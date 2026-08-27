import { Result } from "../common/Result.js";
import { MAX_OUTPUT_TOKENS } from "../common/constants.js";
import type { GenerateCopyRequest } from "../dtos/GenerateCopyRequest.js";
import type { AiProvider } from "../ports/AiProvider.js";
import type { GenerationRepository } from "../ports/GenerationRepository.js";
import { buildCopyPrompt } from "./promptBuilder.js";
import type { Generation } from "../../domain/entities/Generation.js";

export class GenerateCopyService {
  constructor(
    private readonly aiProvider: AiProvider,
    private readonly generationRepository: GenerationRepository,
  ) {}

  async generate(
    request: GenerateCopyRequest,
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
