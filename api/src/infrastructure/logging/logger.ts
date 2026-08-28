import pino, { type LoggerOptions } from "pino";
import { env } from "../../config/env.js";

// pino-pretty es devDependency (no viaja en la imagen de producción, ver
// deploy/Dockerfile). Si esto quedara atado a LOG_LEVEL en vez de a
// NODE_ENV, poner LOG_LEVEL=debug en el .env del server para depurar algo
// puntual tumbaría el proceso al arrancar (pino no encuentra el transport).
const options: LoggerOptions =
  process.env.NODE_ENV === "production"
    ? { level: env.LOG_LEVEL }
    : { level: env.LOG_LEVEL, transport: { target: "pino-pretty", options: { colorize: true } } };

export const logger = pino(options);
