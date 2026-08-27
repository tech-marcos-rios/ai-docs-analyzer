import Anthropic from "@anthropic-ai/sdk";
import type { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import type {
  AiGenerationStream,
  AiProvider,
  AiStreamChunk,
  AiUsage,
} from "../../application/ports/AiProvider.js";

const MODEL = "claude-haiku-4-5";

class ClaudeGenerationStream implements AiGenerationStream {
  constructor(private readonly stream: MessageStream) {}

  async *[Symbol.asyncIterator](): AsyncIterator<AiStreamChunk> {
    for await (const event of this.stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { text: event.delta.text };
      }
    }
  }

  async getUsage(): Promise<AiUsage> {
    const finalMessage = await this.stream.finalMessage();
    return {
      tokensUsed: finalMessage.usage.output_tokens + finalMessage.usage.input_tokens,
      model: finalMessage.model,
    };
  }
}

export class ClaudeProvider implements AiProvider {
  readonly name = "claude";

  constructor(private readonly client: Anthropic) {}

  generateStream(prompt: string, maxTokens: number): AiGenerationStream {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    return new ClaudeGenerationStream(stream);
  }
}
