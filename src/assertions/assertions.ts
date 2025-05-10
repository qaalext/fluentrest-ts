import { AxiosResponse } from "axios";
import Joi from "joi";
import chalk from "chalk";
import { JSONPath } from "jsonpath-plus";
import { logError, formatError, LogLevel } from "../core/logger";

/**
 * Asserts that the response status code matches the expected status.
 */
export function expectStatus(
  response: AxiosResponse,
  status: number,
  logLevel: LogLevel,
  logToFile: boolean
): void {
  try {
    if (response.status !== status) {
      throw new Error(`Expected status ${status}, got ${response.status}`);
    }
    if (logLevel !== "none")
      console.log(chalk.green(`✔ Status ${status} as expected.`));
  } catch (error: any) {
    const formatted = formatError("Status assertion failed", error, response.data, "ERR_ASSERTION_STATUS");
    logError(error, "Status Assertion Error", logLevel, logToFile, response.data, "ERR_ASSERTION_STATUS");
    throw new Error(formatted);
  }
}

/**
 * Asserts that a value at a JSONPath in the body matches the expected value.
 */
export function expectBody(
  response: AxiosResponse,
  path: string,
  expected: any,
  logLevel: LogLevel,
  logToFile: boolean
): void {
  try {
    const results = JSONPath({ path, json: response.data });
    const actual = results[0];
    if (!results.length || actual !== expected) {
      throw new Error(`Expected value at '${path}' to be '${expected}', got '${actual}'`);
    }
    if (logLevel !== "none")
      console.log(chalk.green(`✔ Body value at '${path}' is '${expected}' as expected.`));
  } catch (error: any) {
    const formatted = formatError("Body assertion failed", error, response.data, "ERR_ASSERTION_BODY");
    logError(error, "Body Assertion Error", logLevel, logToFile, response.data, "ERR_ASSERTION_BODY");
    throw new Error(formatted);
  }
}

/**
 * Asserts that a response header matches the expected value.
 */
export function expectHeader(
  response: AxiosResponse,
  headerKey: string,
  expectedValue: string,
  logLevel: LogLevel,
  logToFile: boolean
): void {
  try {
    const actual = response.headers?.[headerKey.toLowerCase()];
    if (actual !== expectedValue) {
      throw new Error(`Expected header '${headerKey}' to be '${expectedValue}', got '${actual}'`);
    }
    if (logLevel !== "none")
      console.log(chalk.green(`✔ Header '${headerKey}' is '${expectedValue}' as expected.`));
  } catch (error: any) {
    const formatted = formatError("Header assertion failed", error, response.headers, "ERR_ASSERTION_HEADER");
    logError(error, "Header Assertion Error", logLevel, logToFile, response.headers, "ERR_ASSERTION_HEADER");
    throw new Error(formatted);
  }
}

/**
 * Asserts that the response body contains the specified key-value fragment.
 */
export function expectBodyContains(
  response: AxiosResponse,
  fragment: object,
  logLevel: LogLevel,
  logToFile: boolean
): void {
  try {
    const responseBody = JSON.stringify(response.data);
    const matches = Object.entries(fragment).every(
      ([key, value]) => responseBody.includes(`"${key}":${JSON.stringify(value)}`)
    );

    if (!matches) {
      throw new Error(`Expected body to contain fragment: ${JSON.stringify(fragment)}`);
    }
    if (logLevel !== "none")
      console.log(chalk.green(`✔ Body contains expected fragment.`));
  } catch (error: any) {
    const formatted = formatError("Body fragment check failed", error, response.data, "ERR_ASSERTION_FRAGMENT");
    logError(error, "Body Fragment Assertion Error", logLevel, logToFile, response.data, "ERR_ASSERTION_FRAGMENT");
    throw new Error(formatted);
  }
}

/**
 * Validates the full response body against a Joi schema.
 */
export function validateBody(
  response: AxiosResponse,
  schema: Joi.Schema,
  logLevel: LogLevel,
  logToFile: boolean
): void {
  try {
    const { error } = schema.validate(response.data);
    if (error) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
    if (logLevel !== "none")
      console.log(chalk.green(`✔ Schema validation passed.`));
  } catch (error: any) {
    const formatted = formatError("Schema validation failed", error, response.data, "ERR_VALIDATION_SCHEMA");
    logError(error, "Schema Validation Error", logLevel, logToFile, response.data, "ERR_VALIDATION_SCHEMA");
    throw new Error(formatted);
  }
}
