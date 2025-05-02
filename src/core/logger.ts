import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { RestAssuredDefaults } from "./config";

export type LogLevel = "none" | "error" | "info" | "debug";

const LOG_FILE = path.resolve(process.cwd(), RestAssuredDefaults.logFilePath);

if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function shouldLog(logLevel: LogLevel, messageLevel: LogLevel): boolean {
  const levels: LogLevel[] = ["none", "error", "info", "debug"];
  return levels.indexOf(logLevel) >= levels.indexOf(messageLevel);
}

function getColor(level: LogLevel) {
  return level === "error" ? chalk.red :
         level === "info"  ? chalk.cyan :
         level === "debug" ? chalk.gray :
         chalk.white;
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
  method: string,
  endpoint: string,
  config: AxiosRequestConfig,
  logLevel: LogLevel,
  logToFile: boolean
) {
  const data = {
    method,
    url: endpoint,
    headers: config.headers,
    params: config.params,
    data: config.data,
    timeout: config.timeout,
    baseURL: config.baseURL
  };

  log("Request", data, logLevel, logToFile, "info");
}

export function logResponse(
  response: AxiosResponse,
  logLevel: LogLevel,
  logToFile: boolean
) {
  const data = {
    status: response.status,
    data: response.data,
    statusText: response.statusText,
    headers: response.headers
  };

  log("Response", data, logLevel, logToFile, "info");
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
  log(label, { message: formatted }, logLevel, logToFile, "error");
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
