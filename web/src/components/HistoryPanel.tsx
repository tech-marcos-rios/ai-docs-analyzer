"use client";

import { Download, History } from "lucide-react";
import type { Generation } from "@/lib/types";
import { downloadCsv, generationsToCsv } from "@/lib/csv";

interface HistoryPanelProps {
  generations: Generation[];
  isLoading: boolean;
}

export function HistoryPanel({ generations, isLoading }: HistoryPanelProps) {
  function handleExport() {
    downloadCsv(`generaciones-${Date.now()}.csv`, generationsToCsv(generations));
  }

  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-200">
          <History className="h-4 w-4" /> Historial
        </h2>
        <button
          onClick={handleExport}
          disabled={generations.length === 0}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Cargando...</p>}

        {!isLoading && generations.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no generaste nada.</p>
        )}

        {generations.map((g) => (
          <div key={g.id} className="rounded-md border border-neutral-800 bg-neutral-900/40 p-2.5">
            <p className="truncate text-sm font-medium text-neutral-200">{g.productName}</p>
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{g.generatedText}</p>
            <p className="mt-1 text-[11px] text-neutral-600">
              {g.tone} · {g.language} · {g.tokensUsed} tokens
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
