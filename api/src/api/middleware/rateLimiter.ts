import rateLimit from "express-rate-limit";

// Ver CLAUDE.md "Control de costos de IA": 5 req/min y 50/día por IP.
export const perMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, title: "Demasiadas solicitudes, esperá un minuto." },
});

export const perDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, title: "Límite diario de generaciones alcanzado." },
});
