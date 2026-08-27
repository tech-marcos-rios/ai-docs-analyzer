import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app.js";
import { GenerateCopyService } from "../../src/application/services/GenerateCopyService.js";
import type { AiProvider } from "../../src/application/ports/AiProvider.js";
import type { GenerationRepository } from "../../src/application/ports/GenerationRepository.js";

function buildApp() {
  const aiProvider: AiProvider = {
    name: "claude",
    generateStream: () => {
      throw new Error("no debería llamarse con un body inválido");
    },
  };
  const generationRepository: GenerationRepository = {
    save: vi.fn(),
    getRecent: vi.fn(),
  };
  const generateCopyService = new GenerateCopyService(aiProvider, generationRepository);
  return createApp({ generateCopyService, generationRepository });
}

describe("GET /health", () => {
  it("responde ok", async () => {
    const response = await request(buildApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/generate", () => {
  it("devuelve 400 cuando el body es inválido", async () => {
    const response = await request(buildApp()).post("/api/generate").send({ productName: "M" });
    const body = response.body as { title: string };

    expect(response.status).toBe(400);
    expect(body.title).toBe("Validation error");
  });
});
