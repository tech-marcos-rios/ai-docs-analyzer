import pino, { type LoggerOptions } from "pino";
import { env } from "../../config/env.js";

const options: LoggerOptions =
  env.LOG_LEVEL === "debug"
    ? { level: env.LOG_LEVEL, transport: { target: "pino-pretty", options: { colorize: true } } }
    : { level: env.LOG_LEVEL };

export const logger = pino(options);
