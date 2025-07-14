import Joi from "joi";
import { AxiosRequestConfig, AxiosResponse } from "axios";
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
    private logToFile: boolean = false
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
    return this.config!;
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
  catchAndLog(fn: () => void): this {
    if (this.error) {
      throw new Error(`Request failed: ${this.error.message ?? this.error}`);
    }
    try {
      fn();
    } catch (err) {
      logError(err, "Assertion Failed", this.logLevel, this.logToFile, this.response?.data);
      throw err;
    }
    return this;
  }
}
