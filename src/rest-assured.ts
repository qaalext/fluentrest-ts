import { AxiosRequestConfig, AxiosResponse } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import Joi from "joi";

import { RestAssuredCore } from "./core/request-core";
import {
  expectStatus,
  expectBody,
  expectHeader,
  expectBodyContains,
  validateBody,
} from "./assertions/assertions";
import { extract } from "./core/utils";
import { logError } from "./core/logger";
import { RestAssuredDefaults } from "./core/config";
import { RequestBuilder, ResponseValidator } from "./contracts/request-types";

/**
 * Fluent API for REST request setup and validation.
 * Extends `RestAssuredCore` for request handling, adds setup and assertion steps.
 */
export class RestAssured extends RestAssuredCore implements ResponseValidator {
  // ---------- Request Setup (Pre-request) ----------

  public setBaseUrl(baseURL: string): this {
    this.config.baseURL = baseURL;
    return this;
  }

  public setTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  public givenHeader(key: string, value: string): this {
    this.config.headers = { ...this.config.headers, [key]: value };
    return this;
  }

  public givenQueryParam(key: string, value: string): this {
    this.config.params = { ...this.config.params, [key]: value };
    return this;
  }

  public givenBody(body: object): this {
    this.config.data = body;
    return this;
  }

  public givenFormData(fields: { [key: string]: string }): this {
    const form = new FormData();
    for (const key in fields) {
      const value = fields[key];
      const isFile = fs.existsSync(value);
      form.append(key, isFile ? fs.createReadStream(value) : value);
    }
    this.config.data = form;
    this.config.headers = { ...this.config.headers, ...form.getHeaders() };
    return this;
  }

  // ---------- Post-request Validators ----------

  public thenExpectStatus(status: number): this {
    if (!this.response) throw new Error("No response to validate status.");
    expectStatus(this.response, status, this.logLevel, this.logToFile);
    return this;
  }

  public thenExpectBody(path: string, expected: any): this {
    if (!this.response) throw new Error("No response to validate body.");
    expectBody(this.response, path, expected, this.logLevel, this.logToFile);
    return this;
  }

  public thenExpectBodyContains(fragment: object): this {
    if (!this.response)
      throw new Error("No response to validate body fragment.");
    expectBodyContains(this.response, fragment, this.logLevel, this.logToFile);
    return this;
  }

  public thenValidateBody(schema: Joi.Schema): this {
    if (!this.response) throw new Error("No response to validate schema.");
    validateBody(this.response, schema, this.logLevel, this.logToFile);
    return this;
  }

  public thenExpectHeader(headerKey: string, expectedValue: string): this {
    if (!this.response) throw new Error("No response to validate header.");
    expectHeader(
      this.response,
      headerKey,
      expectedValue,
      this.logLevel,
      this.logToFile
    );
    return this;
  }

  public thenExtract(path: string): any {
    if (!this.response) throw new Error("No response to extract from.");
    return extract(this.response, path);
  }

  public getResponse(): AxiosResponse {
    if (!this.response) throw new Error("No response available.");
    return this.response;
  }
  public getRequestConfig(): AxiosRequestConfig {
    return this.config;
  }

  public catchAndLog(fn: () => void): this {
    try {
      fn();
    } catch (error: any) {
      logError(
        error,
        "Caught Error",
        this.logLevel,
        this.logToFile,
        this.response?.data,
        "ERR_CUSTOM_FLOW"
      );
      throw error;
    }
    return this;
  }

}

/**
 * Factory function to instantiate `RestAssured` with optional overrides.
 */
export const fluentRest = (
  options?: Partial<typeof RestAssuredDefaults>
): RequestBuilder => {
  if (options) Object.assign(RestAssuredDefaults, options);
  return new RestAssured();
};
