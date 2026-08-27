import { describe, expect, it, vi } from "vitest";
import { GenerateCopyService } from "../../src/application/services/GenerateCopyService.js";
import type { AiGenerationStream, AiProvider } from "../../src/application/ports/AiProvider.js";
import type { GenerationRepository } from "../../src/application/ports/GenerationRepository.js";
import type { Generation } from "../../src/domain/entities/Generation.js";

function fakeStream(
  chunks: string[],
  usage = { tokensUsed: 42, model: "claude-haiku-4-5" },
): AiGenerationStream {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) {
        yield { text };
      }
    },
    async getUsage() {
      return usage;
    },
  };
}

const baseRequest = {
  productName: "Mate de acero inoxidable",
  features: ["Doble pared", "Termo incluido"],
  tone: "casual" as const,
  language: "es",
};

describe("GenerateCopyService", () => {
  it("streams chunks, persiste la generación y devuelve éxito", async () => {
    const aiProvider: AiProvider = {
      name: "claude",
      generateStream: () => fakeStream(["Hola ", "mundo"]),
    };

    const saved: Generation = {
      id: "1",
      ...baseRequest,
      generatedText: "Hola mundo",
      provider: "claude",
      model: "claude-haiku-4-5",
      tokensUsed: 42,
      createdAt: new Date(),
    };

    const generationRepository: GenerationRepository = {
      save: vi.fn().mockResolvedValue(saved),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const chunksReceived: string[] = [];

    const result = await service.generate(baseRequest, (chunk) => chunksReceived.push(chunk));

    expect(chunksReceived).toEqual(["Hola ", "mundo"]);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(saved);
    expect(generationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ generatedText: "Hola mundo", tokensUsed: 42 }),
    );
  });

  it("devuelve failure cuando el modelo no genera contenido", async () => {
    const aiProvider: AiProvider = {
      name: "claude",
      generateStream: () => fakeStream([]),
    };

    const generationRepository: GenerationRepository = {
      save: vi.fn(),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.generate(baseRequest, () => {});

    expect(result.isSuccess).toBe(false);
    expect(generationRepository.save).not.toHaveBeenCalled();
  });
});
