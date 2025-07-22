import Joi from "joi";
import { AxiosProxyConfig, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  expectStatus,
  expectBody,
  expectHeader,
  expectBodyContains,
  validateBody
} from "../assertions/assertions";
import { extract } from "./utils";
import { logError, LogLevel } from "./logger";
import { ResponseValidator } from "../contracts/response-validator-type";

/**
 * A wrapper around the HTTP response (or error),
 * allowing safe validation and debugging.
 */
export class ResponseValidatorImpl implements ResponseValidator {
  constructor(
    private response?: AxiosResponse,
    public error?: any,
    private config?: AxiosRequestConfig,
    private logLevel: LogLevel = "info",
    private logToFile: boolean = false,
    private proxyOverride?: AxiosProxyConfig,
    private proxyAgent?: any
  ) {}

  /** Returns true if the request failed due to error or missing response. */
  wasFailure(): boolean {
    return !!this.error || !this.response;
  }

  /** Returns the raw Axios response object (throws if not available). */
  getResponse(): AxiosResponse {
    if (!this.response) throw new Error("No response available.");
    return this.response;
  }

  /** Returns the Axios request config used to send the request. */
  getRequestConfig(): AxiosRequestConfig {
    return {
      ...this.config!,
      ...(this.proxyOverride ? { proxy: this.proxyOverride } : {}),
      ...(this.proxyAgent ? { httpAgent: this.proxyAgent, httpsAgent: this.proxyAgent } : {})
    };
  }

  /** Asserts that the response status matches the expected value. */
  thenExpectStatus(status: number): this {
    if (!this.response) throw new Error("No response to validate status.");
    expectStatus(this.response, status, this.logLevel, this.logToFile);
    return this;
  }

  /** Asserts that a JSONPath value in the body matches the expected value. */
  thenExpectBody(path: string, expected: any): this {
    if (!this.response) throw new Error("No response to validate body.");
    expectBody(this.response, path, expected, this.logLevel, this.logToFile);
    return this;
  }

  /** Asserts that the body contains a specified fragment of key-values. */
  thenExpectBodyContains(fragment: object): this {
    if (!this.response) throw new Error("No response to validate body.");
    expectBodyContains(this.response, fragment, this.logLevel, this.logToFile);
    return this;
  }

  /** Validates the entire body against a Joi schema. */
  thenValidateBody(schema: Joi.Schema): this {
    if (!this.response) throw new Error("No response to validate schema.");
    validateBody(this.response, schema, this.logLevel, this.logToFile);
    return this;
  }

  /** Asserts that a response header matches the expected value. */
  thenExpectHeader(key: string, value: string): this {
    if (!this.response) throw new Error("No response to validate header.");
    expectHeader(this.response, key, value, this.logLevel, this.logToFile);
    return this;
  }

  /** Extracts a value from the response body using a JSONPath. */
  thenExtract(path: string): any {
    if (!this.response) throw new Error("No response to extract from.");
    return extract(this.response, path);
  }

  /** Returns the parsed JSON body of the response (throws if unavailable). */
  thenJson<T = any>(): T {
    if (!this.response) throw new Error("No response available to parse JSON.");
    return this.response.data as T;
  }

  /**
   * Executes a custom assertion or extraction callback
   * and logs failure context if it throws.
   */
  
  catchAndLog(fn?: (err: Error) => void): this {
    if (this.error) {
      const err = this.error instanceof Error ? this.error : new Error(String(this.error));

      // Inject response body for context
      if (this.response?.data && typeof this.response.data === 'object') {
        err.message += `\nServer response: ${JSON.stringify(this.response.data)}`;
      }

      if (fn) fn(err);
      else throw err;

      return this;
    }

    try {
      fn?.(new Error("Unexpected call to catchAndLog without error"));
    } catch (err) {
      logError(err, "Assertion Failed", this.logLevel, this.logToFile, this.response?.data);
      throw err;
    }

    return this;
  }

  /** Returns the raw error body (typically from server) if available. */
  getErrorBody<T = any>(): T | undefined {
    return this.response?.data;
  }


  /**
 * Runs multiple assertions on the current response context and aggregates any errors.
 * This allows for soft-failing multiple expectations without throwing after the first failure.
 * 
 * Each assertion receives the current response object (`this`) and is expected
 * to throw an `Error` if it fails. All such errors are caught, aggregated,
 * and re-thrown at the end as a combined error with summary output.
 *
 * @param assertions - Array of functions to run, each receiving the response context.
 * @returns `this` for chaining.
 * 
 * @example
 * await res.runAssertions([
 *   r => r.thenExpectStatus(404),
 *   r => r.thenExpectBody('$.error', 'Not Found'),
 * ]).catchAndLog(...);
 */
runAssertions(
  assertions: ((res: this) => void | Promise<void> | this)[]
): this {
  
  const errors: Error[] = [];

  for (const fn of assertions) {
    try {
      fn(this);
    } catch (e) {
      if (e instanceof Error) {
        errors.push(e);
      } else {
        errors.push(new Error(String(e)));
      }
    }
  }

  if (errors.length > 0) {
    const summary = errors.map(e => e.message).join('\n');
    throw new Error(`Multiple assertion failures:\n${summary}`);
  }

  return this;
}

}
