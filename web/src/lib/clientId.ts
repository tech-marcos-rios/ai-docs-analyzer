const STORAGE_KEY = "ai-docs-analyzer:client-id";

/**
 * ID anónimo persistido en localStorage (no es autenticación real) para que
 * el backend pueda scopear el historial por visitante — ver CLAUDE.md del
 * backend, "Historial es público y sin scoping" en la revisión de seguridad.
 */
export function getClientId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage bloqueado (navegación privada, config del navegador, etc.)
    return crypto.randomUUID();
  }
}
