import { getClientId } from "./clientId";
import type { GenerateCopyRequest, Generation } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type SseEvent =
  | { event: "chunk"; data: { text: string } }
  | { event: "done"; data: { id: string } }
  | { event: "error"; data: { message: string } };

function parseSseEvent(raw: string): SseEvent | null {
  let eventName = "";
  let data = "";

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }

  if (!eventName || !data) return null;
  return { event: eventName, data: JSON.parse(data) } as SseEvent;
}

/**
 * SSE manual sobre fetch + ReadableStream — no se puede usar EventSource nativo
 * porque el endpoint necesita un POST con body JSON.
 */
export async function* streamGeneration(
  request: GenerateCopyRequest,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Id": getClientId() },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { title?: string } | null;
    throw new Error(body?.title ?? `Error ${response.status} generando el contenido.`);
  }
  if (!response.body) {
    throw new Error("El servidor no devolvió un stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const parsed = parseSseEvent(rawEvent);
      if (parsed) yield parsed;
      separatorIndex = buffer.indexOf("\n\n");
    }
  }
}

export async function fetchHistory(limit = 20): Promise<Generation[]> {
  const response = await fetch(`${API_URL}/api/history?limit=${limit}`, {
    headers: { "X-Client-Id": getClientId() },
  });
  if (!response.ok) {
    throw new Error("No se pudo cargar el historial.");
  }
  const body = (await response.json()) as { generations: Generation[] };
  return body.generations;
}
