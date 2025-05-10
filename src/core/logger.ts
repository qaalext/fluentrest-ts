import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { getCurrentDefaults } from "./config";

export type LogLevel = "debug" | "info" | "none";

function resolveLogFilePath(): string {
  return path.resolve(process.cwd(), getCurrentDefaults().logFilePath);
}

export function writeLogFile(label: string, data: any) {
  const logPath = resolveLogFilePath();
  if (!fs.existsSync(path.dirname(logPath))) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
  }

  const logEntry = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
  fs.appendFileSync(logPath, logEntry);
}

/**
 * Determines if a message should be logged based on the current and required log levels.
 * @param current - The current log level set for the system.
 * @param required - The minimum log level required to perform the log.
 * @returns boolean indicating whether the log should be executed.
 */
function shouldLog(current: LogLevel, required: LogLevel): boolean {
  const levels = { none: 0, info: 1, debug: 2 };
  return levels[current] >= levels[required];
}

/**
 * Returns a colorized chalk function based on the provided log level.
 * Used to visually differentiate log messages in the terminal.
 * @param level - The log level.
 * @returns chalk color function for the given level.
 */
function getColor(level: LogLevel) {
  return level === "debug" ? chalk.gray :
         level === "info" ? chalk.cyan :
         chalk.white; // fallback, should never happen
}

/**
 * Logs a labeled data message to the console and optionally to a file.
 * Logging respects the current log level and configured verbosity.
 * @param label - Descriptive label for the log entry.
 * @param data - Any payload to log (object, string, etc).
 * @param logLevel - Current configured log level.
 * @param logToFile - Flag indicating whether to write logs to a file.
 * @param level - Log level required to execute the log (defaults to 'info').
 */
export function log(
  label: string,
  data: any,
  logLevel: LogLevel,
  logToFile: boolean,
  level: LogLevel = "info"
) {
  if (!shouldLog(logLevel, level)) return;

  const color = getColor(level);
  console.log(color(`\n--- ${label} ---`));
  console.dir(data, { depth: null, colors: true });

  if (logToFile) {
    writeLogFile(label, data);
  }
}

/**
 * Logs request details including method, URL, headers, params, and body.
 * Respects the log level (skips if below 'info').
 */
export function logRequest(
  config: AxiosRequestConfig,
  logLevel: LogLevel,
  logToFile: boolean
) {
  if (!shouldLog(logLevel, "info")) return;

  let requestLog: any = {
    method: config.method,
    baseURL: config.baseURL,
    endpoint: config.url,
    data: config.data,
  };
  
  if (shouldLog(logLevel, "debug")) {
    requestLog = {
      ...requestLog,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout,
      baseURL: config.baseURL
    };
  }

  log("Request", requestLog, logLevel, logToFile, "info");
}

/**
 * Logs the full HTTP response: status, headers, and body.
 * Skips logging unless log level is 'info' or 'debug'.
 */
export function logResponse(
  response: AxiosResponse,
  logLevel: LogLevel,
  logToFile: boolean
) {

  if (!shouldLog(logLevel, "info")) return;
  let responseLog: any = {
    status: response.status,
    data: response.data,
  };
  
  if (shouldLog(logLevel, "debug")) {
    responseLog = {
      ...responseLog,
      headers: response.headers,
      data: response.data,
      statusText: response.statusText
    };
  }

  log("Response", responseLog, logLevel, logToFile, "info");
}

/**
 * Logs errors that occur during request execution or assertions.
 * This always logs if log level is 'error' or higher.
 * Optionally writes error details to file if `toFile` is enabled.
 */
export function logError(
  error: any,
  label: string,
  logLevel: LogLevel,
  logToFile: boolean,
  responseBody?: any,
  errorCode?: string
) {
  const formatted = formatError(label, error, responseBody, errorCode);
  // Always log errors regardless of logLevel — this is a test failure
  log(label, { message: formatted }, logLevel, logToFile, "debug");
}

/**
 * Helper to format error messages consistently for throwing or logging.
 * Includes optional context like payload and custom error code.
 */
export function formatError(
  message: string,
  error: any,
  responseBody?: any,
  errorCode?: string
): string {
  const stack = error?.stack ?? "No stack trace";
  const bodySnippet = responseBody
    ? `\nResponse Body:\n${JSON.stringify(responseBody, null, 2)}`
    : "";
  const codePrefix = errorCode ? `[${errorCode}] ` : "";

  return `${codePrefix}${message}\n${stack}${bodySnippet}`;
}
