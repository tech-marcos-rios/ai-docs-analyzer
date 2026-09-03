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

const CLIENT_ID = "client-abc";
const RESERVATION_ID = "reserved-1";

describe("GenerateCopyService.generate", () => {
  it("streams chunks, finaliza la reserva y devuelve éxito", async () => {
    const aiProvider: AiProvider = {
      name: "claude",
      generateStream: () => fakeStream(["Hola ", "mundo"]),
    };

    const finalized: Generation = {
      id: RESERVATION_ID,
      clientId: CLIENT_ID,
      ...baseRequest,
      generatedText: "Hola mundo",
      provider: "claude",
      model: "claude-haiku-4-5",
      tokensUsed: 42,
      createdAt: new Date(),
    };

    const generationRepository: GenerationRepository = {
      reserveSlot: vi.fn(),
      finalize: vi.fn().mockResolvedValue(finalized),
      discard: vi.fn(),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const chunksReceived: string[] = [];

    const result = await service.generate(RESERVATION_ID, baseRequest, (chunk) =>
      chunksReceived.push(chunk),
    );

    expect(chunksReceived).toEqual(["Hola ", "mundo"]);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(finalized);
    expect(generationRepository.finalize).toHaveBeenCalledWith(
      RESERVATION_ID,
      expect.objectContaining({ generatedText: "Hola mundo", tokensUsed: 42 }),
    );
    expect(generationRepository.discard).not.toHaveBeenCalled();
  });

  it("descarta la reserva y devuelve failure cuando el modelo no genera contenido", async () => {
    const aiProvider: AiProvider = {
      name: "claude",
      generateStream: () => fakeStream([]),
    };

    const generationRepository: GenerationRepository = {
      reserveSlot: vi.fn(),
      finalize: vi.fn(),
      discard: vi.fn(),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.generate(RESERVATION_ID, baseRequest, () => {});

    expect(result.isSuccess).toBe(false);
    expect(generationRepository.finalize).not.toHaveBeenCalled();
    expect(generationRepository.discard).toHaveBeenCalledWith(RESERVATION_ID);
  });
});

describe("GenerateCopyService.reserveSlot", () => {
  const aiProvider: AiProvider = { name: "claude", generateStream: () => fakeStream([]) };

  it("permite generar y devuelve el id reservado cuando hay lugar", async () => {
    const generationRepository: GenerationRepository = {
      reserveSlot: vi.fn().mockResolvedValue(RESERVATION_ID),
      finalize: vi.fn(),
      discard: vi.fn(),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.reserveSlot(baseRequest, CLIENT_ID);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(RESERVATION_ID);
  });

  it("bloquea cuando el repositorio no pudo reservar (tope diario alcanzado)", async () => {
    const generationRepository: GenerationRepository = {
      reserveSlot: vi.fn().mockResolvedValue(null),
      finalize: vi.fn(),
      discard: vi.fn(),
      getRecent: vi.fn(),
    };

    const service = new GenerateCopyService(aiProvider, generationRepository);
    const result = await service.reserveSlot(baseRequest, CLIENT_ID);

    expect(result.isSuccess).toBe(false);
  });
});
