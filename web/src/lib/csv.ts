import type { Generation } from "./types";

// Neutraliza CSV/formula injection: si Excel/Sheets abre una celda que arranca
// con estos caracteres, la interpreta como fórmula en vez de texto.
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@", "\t", "\r"];

function neutralizeFormula(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGER_CHARS.includes(value[0])) {
    return `'${value}`;
  }
  return value;
}

function escapeCsvValue(value: string): string {
  const safeValue = neutralizeFormula(value);
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

export function generationsToCsv(generations: Generation[]): string {
  const header = ["productName", "tone", "language", "generatedText", "createdAt"];
  const rows = generations.map((g) =>
    [g.productName, g.tone, g.language, g.generatedText, g.createdAt]
      .map(escapeCsvValue)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
