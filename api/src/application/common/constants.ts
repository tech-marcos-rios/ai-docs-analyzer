// Tope de tokens de salida por generación — ver CLAUDE.md "Control de costos de IA".
export const MAX_OUTPUT_TOKENS = 500;

// Tope global (todos los clientes juntos) de generaciones cada 24hs — protege
// contra abuso distribuido entre muchas IPs, que el rate limit por IP no cubre.
export const GLOBAL_DAILY_GENERATION_LIMIT = 300;
