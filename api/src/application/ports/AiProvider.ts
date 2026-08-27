export interface AiStreamChunk {
  text: string;
}

export interface AiUsage {
  tokensUsed: number;
  model: string;
}

/**
 * Async-iterable de chunks de texto que además expone el uso total
 * (tokens, modelo) una vez que el stream terminó — equivalente a
 * `stream.finalMessage()` del SDK de Anthropic, pero sin acoplar
 * el resto de la app a tipos del SDK.
 */
export interface AiGenerationStream extends AsyncIterable<AiStreamChunk> {
  getUsage(): Promise<AiUsage>;
}

export interface AiProvider {
  readonly name: string;

  generateStream(prompt: string, maxTokens: number): AiGenerationStream;
}
