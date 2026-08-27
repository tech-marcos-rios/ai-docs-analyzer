import type { GenerateCopyRequest } from "../dtos/GenerateCopyRequest.js";

export function buildCopyPrompt(request: GenerateCopyRequest): string {
  const featuresList = request.features.map((f) => `- ${f}`).join("\n");

  return [
    `Escribí una descripción de producto para e-commerce en idioma "${request.language}", con tono "${request.tone}".`,
    `Producto: ${request.productName}`,
    `Características:`,
    featuresList,
    ``,
    `Devolvé solo el texto de la descripción, sin títulos ni comentarios adicionales.`,
  ].join("\n");
}
