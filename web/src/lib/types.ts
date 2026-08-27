import type { toneOptions } from "./schema";

export type Tone = (typeof toneOptions)[number];

export interface GenerateCopyRequest {
  productName: string;
  features: string[];
  tone: Tone;
  language: string;
}

export interface Generation {
  id: string;
  productName: string;
  features: string[];
  tone: string;
  language: string;
  generatedText: string;
  provider: string;
  model: string;
  tokensUsed: number;
  createdAt: string;
}
