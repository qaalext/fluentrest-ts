import { LogLevel } from "./logger";

/**
 * Default configuration values for the RestAssured client.
 * Can be overridden globally via environment or locally at runtime.
 */
export const RestAssuredDefaults = {
  timeout: Number(process.env.RA_TIMEOUT ?? 10000),
  logLevel: (process.env.RA_LOG_LEVEL as LogLevel) ?? "info",
  logFilePath: process.env.RA_LOG_FILE ?? `logs/restassured-${process.pid}.log`,
  baseUrl: process.env.RA_BASE_URL ?? "https://example.com"
};
