"use client";

import { useEffect, useState } from "react";
import { GenerateForm } from "@/components/GenerateForm";
import { GenerationOutput } from "@/components/GenerationOutput";
import { HistoryPanel } from "@/components/HistoryPanel";
import { fetchHistory, streamGeneration } from "@/lib/api";
import type { Generation, GenerateCopyRequest } from "@/lib/types";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  function refreshHistory() {
    setIsHistoryLoading(true);
    fetchHistory()
      .then(setHistory)
      .catch(() => setError((prev) => prev ?? "No se pudo cargar el historial."))
      .finally(() => setIsHistoryLoading(false));
  }

  useEffect(() => {
    // Carga inicial: no reafirma isHistoryLoading (ya arranca en true) para que
    // el efecto no dispare un setState sincrónico en su primer render.
    fetchHistory()
      .then(setHistory)
      .catch(() => setError((prev) => prev ?? "No se pudo cargar el historial."))
      .finally(() => setIsHistoryLoading(false));
  }, []);

  async function handleGenerate(request: GenerateCopyRequest) {
    setIsGenerating(true);
    setError(null);
    setGeneratedText("");

    try {
      for await (const event of streamGeneration(request)) {
        if (event.event === "chunk") {
          setGeneratedText((prev) => prev + event.data.text);
        } else if (event.event === "error") {
          setError(event.data.message);
        } else if (event.event === "done") {
          refreshHistory();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado generando el contenido.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-white">AI Copy Generator</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Descripciones de producto para e-commerce, generadas con IA en tiempo real.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <GenerateForm isGenerating={isGenerating} onSubmit={handleGenerate} />
          <GenerationOutput text={generatedText} isGenerating={isGenerating} error={error} />
        </div>

        <aside>
          <HistoryPanel generations={history} isLoading={isHistoryLoading} />
        </aside>
      </div>
    </main>
  );
}
