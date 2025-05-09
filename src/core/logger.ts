import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { getCurrentDefaults } from "./config";

export type LogLevel = "debug" | "info" | "none";

const LOG_FILE = path.resolve(process.cwd(), getCurrentDefaults().logFilePath);

if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function shouldLog(current: LogLevel, required: LogLevel): boolean {
  const levels = { none: 0, info: 1, debug: 2 };
  return levels[current] >= levels[required];
}

function getColor(level: LogLevel) {
  return level === "debug" ? chalk.gray :
         level === "info" ? chalk.cyan :
         chalk.white; // fallback, should never happen
}

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

export function writeLogFile(label: string, data: any) {
  const logEntry = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

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
