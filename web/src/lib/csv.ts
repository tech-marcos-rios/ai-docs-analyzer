import type { Generation } from "./types";

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
