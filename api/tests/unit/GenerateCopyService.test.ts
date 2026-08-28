import { describe, expect, it, vi } from "vitest";
import { GenerateCopyService } from "../../src/application/services/GenerateCopyService.js";
import { GLOBAL_DAILY_GENERATION_LIMIT } from "../../src/application/common/constants.js";
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

const CLIENT_ID = "client-abc";

describe("GenerateCopyService.generate", () => {
  it("streams chunks, persiste la generación (con clientId) y devuelve éxito", async () => {
    const aiProvider: AiProvider = {
      name: "claude",
      generateStream: () => fakeStream(["Hola ", "mundo"]),
    };

    const saved: Generation = {
      id: "1",
      clientId: CLIENT_ID,
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
      countSince: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const chunksReceived: string[] = [];

    const result = await service.generate(baseRequest, CLIENT_ID, (chunk) =>
      chunksReceived.push(chunk),
    );

    expect(chunksReceived).toEqual(["Hola ", "mundo"]);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(saved);
    expect(generationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: CLIENT_ID, generatedText: "Hola mundo", tokensUsed: 42 }),
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
      countSince: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.generate(baseRequest, CLIENT_ID, () => {});

    expect(result.isSuccess).toBe(false);
    expect(generationRepository.save).not.toHaveBeenCalled();
  });
});

describe("GenerateCopyService.checkGlobalCapacity", () => {
  const aiProvider: AiProvider = { name: "claude", generateStream: () => fakeStream([]) };

  it("permite generar cuando el conteo diario está debajo del límite", async () => {
    const generationRepository: GenerationRepository = {
      save: vi.fn(),
      getRecent: vi.fn(),
      countSince: vi.fn().mockResolvedValue(GLOBAL_DAILY_GENERATION_LIMIT - 1),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.checkGlobalCapacity();

    expect(result.isSuccess).toBe(true);
  });

  it("bloquea cuando se alcanzó el límite diario global", async () => {
    const generationRepository: GenerationRepository = {
      save: vi.fn(),
      getRecent: vi.fn(),
      countSince: vi.fn().mockResolvedValue(GLOBAL_DAILY_GENERATION_LIMIT),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.checkGlobalCapacity();

    expect(result.isSuccess).toBe(false);
  });
});
