import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { RestAssuredDefaults } from "./config";



export type LogLevel = "none" | "error" | "info" | "debug";

const LOG_FILE = path.resolve(
  process.cwd(),
  RestAssuredDefaults.logFilePath
);

if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function shouldLog(logLevel: LogLevel, messageLevel: "debug" | "info" | "error"): boolean {
  if (logLevel === "none") return false;
  if (logLevel === "debug") return true;
  if (logLevel === "info") return messageLevel !== "debug";
  if (logLevel === "error") return messageLevel === "error";
  return false;
}

function getColor(level: "debug" | "info" | "error") {
  return level === "error"
    ? chalk.red
    : level === "info"
    ? chalk.cyan
    : chalk.gray;
}

export function writeLogFile(label: string, data: any) {
  const logEntry = `\n--- ${label} ---\n${JSON.stringify(data, null, 2)}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

export function log(
  label: string,
  data: any,
  logLevel: LogLevel,
  logToFile: boolean,
  level: "debug" | "info" | "error"
) {
  if (!shouldLog(logLevel, level)) return;

  const color = getColor(level);
  console.log(color(`\n--- ${label} ---`));
  console.dir(data, { depth: null, colors: true });

  if (logToFile) {
    writeLogFile(label, data);
  }
}

export function logRequest(
  method: string,
  endpoint: string,
  config: AxiosRequestConfig,
  logLevel: LogLevel,
  logToFile: boolean
) {
  const summary = {
    method,
    url: endpoint,
    headers: config.headers,
    params: config.params,
  };

  const verbose = {
    ...summary,
    data: config.data,
    timeout: config.timeout,
    baseURL: config.baseURL,
  };

  const data = logLevel === "debug" ? verbose : summary;
  const level: "debug" | "info" = logLevel === "debug" ? "debug" : "info";

  log("Request", data, logLevel, logToFile, level);
}

export function logResponse(
  response: AxiosResponse,
  logLevel: LogLevel,
  logToFile: boolean
) {
  const summary = {
    status: response.status,
    data: response.data,
  };

  const verbose = {
    ...summary,
    statusText: response.statusText,
    headers: response.headers,
  };

  const data = logLevel === "debug" ? verbose : summary;
  const level: "debug" | "info" = logLevel === "debug" ? "debug" : "info";

  log("Response", data, logLevel, logToFile, level);
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

// You can include formatError here or import from a separate utils module
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
