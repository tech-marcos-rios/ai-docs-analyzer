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
    countSince: vi.fn().mockResolvedValue(0),
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
  it("devuelve 400 cuando falta el header X-Client-Id", async () => {
    const response = await request(buildApp())
      .post("/api/generate")
      .send({ productName: "Mate", features: ["Doble pared"], tone: "casual", language: "es" });
    const body = response.body as { title: string };

    expect(response.status).toBe(400);
    expect(body.title).toBe("Validation error");
  });

  it("devuelve 400 cuando el body es inválido (con X-Client-Id presente)", async () => {
    const response = await request(buildApp())
      .post("/api/generate")
      .set("X-Client-Id", "client-abc")
      .send({ productName: "M" });
    const body = response.body as { title: string };

    expect(response.status).toBe(400);
    expect(body.title).toBe("Validation error");
  });
});

describe("GET /api/history", () => {
  it("devuelve 400 cuando falta el header X-Client-Id", async () => {
    const response = await request(buildApp()).get("/api/history");
    expect(response.status).toBe(400);
  });
});
