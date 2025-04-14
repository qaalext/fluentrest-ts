// src/request.ts
import { AxiosResponse } from "axios";
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

export class RestAssuredTS extends RestAssuredCore {

  enableFileLogging(enable: boolean = true) {
    this.logToFile = enable;
    return this;
  }

  setBaseUrl(baseURL: string) {
    this.config.baseURL = baseURL;
    return this;
  }

  setTimeout(timeout: number) {
    this.config.timeout = timeout;
    return this;
  }

  givenHeader(key: string, value: string) {
    this.config.headers = { ...this.config.headers, [key]: value };
    return this;
  }

  givenQueryParam(key: string, value: string) {
    this.config.params = { ...this.config.params, [key]: value };
    return this;
  }

  givenBody(body: object) {
    this.config.data = body;
    return this;
  }

  givenFormData(fields: { [key: string]: string }) {
    const form = new FormData();
    for (const key in fields) {
      const value = fields[key];
      const isFile = fs.existsSync(value);
      if (isFile) {
        form.append(key, fs.createReadStream(value));
      } else {
        form.append(key, value);
      }
    }
    this.config.data = form;
    this.config.headers = { ...this.config.headers, ...form.getHeaders() };
    return this;
  }

  thenExpectStatus(status: number): this {
    if (!this.response) throw new Error("No response to get status from.");
    expectStatus(this.response, status, this.logLevel, this.logToFile);
    return this;
  }

  thenExpectBody(path: string, expected: any): this {
    if (!this.response) throw new Error("No response for body check.");
    expectBody(this.response, path, expected, this.logLevel, this.logToFile);
    return this;
  }

  thenExpectBodyContains(fragment: object): this {
    if (!this.response) throw new Error("No response to search fragment.");
    expectBodyContains(this.response, fragment, this.logLevel, this.logToFile);
    return this;
  }

  thenValidateBody(schema: Joi.Schema): this {
    if (!this.response) throw new Error("No response to validate body.");
    validateBody(this.response, schema, this.logLevel, this.logToFile);
    return this;
  }

  thenExpectHeader(headerKey: string, expectedValue: string): this {
    if (!this.response) throw new Error("No response to check for header.");
    expectHeader(this.response, headerKey, expectedValue, this.logLevel, this.logToFile);
    return this;
  }

  thenExtract(path: string): any {
    if (!this.response) throw new Error("No response to extract from.");
    return extract(this.response, path);
  }

  getResponse(): AxiosResponse {
    if (!this.response) throw new Error("No response to fetch.");
    return this.response;
  }

  catchAndLog(fn: () => void): this {
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

export const requestRA = (options?: Partial<typeof RestAssuredDefaults>) => {
  if (options) Object.assign(RestAssuredDefaults, options);
  return new RestAssuredTS();
};