import { AxiosRequestConfig } from "axios";
import FormData from "form-data";
import fs from "fs";
import { RequestExecutor } from "./request-executor";
import { getMergedDefaults, RestAssuredDefaults } from "./config";
import { LogLevel } from "./logger";
import { RequestSnapshot } from "../contracts/request-snapshot";
import { ResponseValidator } from "../contracts/request-types";

/**
 * A fluent builder for configuring HTTP requests.
 * Provides `given*` and `when*` methods to define and trigger requests.
 */
export class RequestBuilder {
  protected config: Partial<AxiosRequestConfig> = {};
  protected logToFile = false;
  protected logLevel: LogLevel = "info";

  constructor(overrides?: Partial<RestAssuredDefaults>) {
    const defaults = getMergedDefaults(overrides);
    this.config.baseURL = defaults.baseUrl;
    this.config.timeout = defaults.timeout;
    this.logLevel = defaults.logLevel;
    this.logToFile = !!defaults.logFilePath;
  }

  /** Sets the base URL for the request. */
  setBaseUrl(url: string): this {
    this.config.baseURL = url;
    return this;
  }

  /** Sets the timeout duration in milliseconds. */
  setTimeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  /** Overrides the log level for this request. */
  setLogLevel(level: LogLevel): this {
    this.logLevel = level;
    return this;
  }

  /** Enables or disables file-based logging. */
  enableFileLogging(enable = true): this {
    this.logToFile = enable;
    return this;
  }

  /** Adds a request header. */
  givenHeader(key: string, value: string): this {
    this.config.headers = { ...this.config.headers, [key]: value };
    return this;
  }

  /** Adds a query string parameter. */
  givenQueryParam(key: string, value: string): this {
    this.config.params = { ...this.config.params, [key]: value };
    return this;
  }

  /** Adds a JSON request body. */
  givenBody(body: object): this {
    this.config.data = body;
    return this;
  }

  /**
   * Adds multipart form-data from file paths or strings.
   * Automatically attaches files if they exist on disk.
   */
  givenFormData(fields: { [key: string]: string }): this {
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

  /** Prints the current request config as a snapshot for debugging. */
  debug(): this {
    console.dir(this.getSnapshot(), { depth: null, colors: true });
    return this;
  }

  /** Returns a snapshot of the request config (used for debugging or logging). */
  getSnapshot(): RequestSnapshot {
    return {
      method: this.config.method,
      url: this.config.url,
      headers: this.config.headers,
      params: this.config.params,
      data: this.config.data,
      timeout: this.config.timeout,
      baseURL: this.config.baseURL,
    };
  }
  async whenGet(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "get",
      endpoint
    );
  }

  async whenPost(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "post",
      endpoint
    );
  }

  async whenPut(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "put",
      endpoint
    );
  }

  async whenDelete(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "delete",
      endpoint
    );
  }

  async whenPatch(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "patch",
      endpoint
    );
  }

  async whenHead(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "head",
      endpoint
    );
  }

  async whenOptions(endpoint: string) {
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "options",
      endpoint
    );
  }

  public getConfig(): AxiosRequestConfig {
    return this.config;
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  public shouldLogToFile(): boolean {
    return this.logToFile;
  }

  /**
   * Executes a request and runs expectations in one step.
   * Useful for compact tests when you want to send a request and immediately assert the response.
   * Optionally accepts request overrides like headers, body, and query params.
   */
  public async sendAndExpect(
    method: "get" | "post" | "put" | "patch" | "delete" | "head" | "options",
    endpoint: string,
    expect: (res: ResponseValidator) => void,
    configOverrides?: {
      headers?: Record<string, string>;
      body?: any;
      params?: Record<string, any>;
    }
  ): Promise<void> {
    // Clone the current builder for immutability
    let builder = this;

    // Apply override headers
    if (configOverrides?.headers) {
      for (const [key, value] of Object.entries(configOverrides.headers)) {
        builder = builder.givenHeader(key, value);
      }
    }

    // Apply override body
    if (configOverrides?.body) {
      builder = builder.givenBody(configOverrides.body);
    }

    // Apply override query parameters
    if (configOverrides?.params) {
      for (const [key, value] of Object.entries(configOverrides.params)) {
        builder = builder.givenQueryParam(key, value); // assumes this method exists
      }
    }

    // Create a new executor and perform the request
    const executor = new RequestExecutor(
      builder.getConfig(),
      builder.getLogLevel(),
      builder.shouldLogToFile()
    );

    const responseValidator = await executor.send(method, endpoint);

    // Pass response to assertion function
    expect(responseValidator);
  }
}
