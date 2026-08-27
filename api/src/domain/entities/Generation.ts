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
  createdAt: Date;
}
