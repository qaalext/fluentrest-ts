import Joi from "joi";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { LogLevel } from "../core/logger";

/**
 * Interface for response-level assertions.
 * Available only after a request has been sent.
 */
export interface ResponseValidator {
  thenExpectStatus(status: number): this;
  thenExpectBody(path: string, expected: any): this;
  thenExpectBodyContains(fragment: object): this;
  thenValidateBody(schema: Joi.Schema): this;
  thenExpectHeader(headerKey: string, expectedValue: string): this;
  thenExtract(path: string): any;
  getResponse(): AxiosResponse;
  getRequestConfig(): AxiosRequestConfig;
  catchAndLog(fn: () => void): this;
}

/**
 * Interface for request builder stage.
 * Chainable setup methods for pre-request configuration.
 */
export interface RequestBuilder {
  enableFileLogging(enable?: boolean): this;
  setLogLevel(level: LogLevel): this;

  setBaseUrl(baseURL: string): this;
  setTimeout(timeout: number): this;
  givenHeader(key: string, value: string): this;
  givenQueryParam(key: string, value: string): this;
  givenBody(body: object): this;
  givenFormData(fields: { [key: string]: string }): this;

  whenGet(endpoint: string): Promise<ResponseValidator>;
  whenPost(endpoint: string): Promise<ResponseValidator>;
  whenPut(endpoint: string): Promise<ResponseValidator>;
  whenPatch(endpoint: string): Promise<ResponseValidator>;
  whenDelete(endpoint: string): Promise<ResponseValidator>;
  whenHead(endpoint: string): Promise<ResponseValidator>;
  whenOptions(endpoint: string): Promise<ResponseValidator>;
  sendAndExpect(
    method: "get" | "post" | "put" | "patch" | "delete" | "head" | "options",
    endpoint: string,
    expect: (res: ResponseValidator) => void,
    configOverrides?: {
      headers?: Record<string, string>;
      body?: any;
      params?: Record<string, any>;
    }
  ): Promise<void>;
}
