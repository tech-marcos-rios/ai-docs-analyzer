"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";

interface GenerationOutputProps {
  text: string;
  isGenerating: boolean;
  error: string | null;
}

export function GenerationOutput({ text, isGenerating, error }: GenerationOutputProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!text && !isGenerating) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-500">
        La descripción generada va a aparecer acá.
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
      <p className="whitespace-pre-wrap text-neutral-100">
        {text}
        {isGenerating && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
      </p>

      {text && !isGenerating && (
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar
            </>
          )}
        </button>
      )}
    </div>
  );
}
