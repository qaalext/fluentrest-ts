import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { logRequest, logResponse, logError, LogLevel } from "./logger";
import { ResponseValidator } from "../contracts/request-types";
import { RequestSnapshot } from "../contracts/request-snapshot";
import { getMergedDefaults, RestAssuredDefaults } from "./config";

/**
 * Handles request configuration and execution logic.
 * This class is intended to be extended (e.g., by RestAssured).
 */
export class RestAssuredCore {
  protected response?: AxiosResponse;
  protected config: AxiosRequestConfig = {};
  protected logToFile = false;
  protected logLevel: LogLevel = "info";

  constructor(overrides?: Partial<RestAssuredDefaults>) {
    const config = getMergedDefaults(overrides);
    this.config.timeout = config.timeout;
    this.config.baseURL = config.baseUrl;
    this.logLevel = config.logLevel;
  }

  /** Useful property that could be used while debugging */
  public get requestSnapshot(): RequestSnapshot {
    return {
      method: this.config.method,
      url: this.config.url,
      headers: this.config.headers,
      params: this.config.params,
      data: this.config.data,
      timeout: this.config.timeout,
      baseURL: this.config.baseURL
    };
  }

  /** Enables logging to a local file (default: true) */
  public enableFileLogging(enable: boolean = true): this {
    this.logToFile = enable;
    return this;
  }

  /** Sets the verbosity level for logging */
  public setLogLevel(level: LogLevel): this {
    this.logLevel = level;
    return this;
  }

  /** Executes a request with the given HTTP method and endpoint */
  protected async sendRequest(method: string, endpoint: string): Promise<ResponseValidator> {
    this.config.method = method.toLowerCase();
    this.config.url = endpoint;

    logRequest(method, endpoint, this.config, this.logLevel, this.logToFile);

    try {
      this.response = await axios.request(this.config);
      logResponse(this.response, this.logLevel, this.logToFile);
    } catch (error: any) {
      logError(error, "Request Failure", this.logLevel, this.logToFile, error?.response?.data);
      throw error;
    }

    return this as unknown as ResponseValidator;
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
    if (configOverrides?.headers) {
      this.config.headers = {
        ...this.config.headers,
        ...configOverrides.headers,
      };
    }

    if (configOverrides?.body) {
      this.config.data = configOverrides.body;
    }

    if (configOverrides?.params) {
      this.config.params = { ...this.config.params, ...configOverrides.params };
    }

    const result = await this.sendRequest(method, endpoint);
    expect(result);
  }

  /** Sends a GET request */
  public async whenGet(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("get", endpoint);
  }

  /** Sends a POST request */
  public async whenPost(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("post", endpoint);
  }

  /** Sends a PUT request */
  public async whenPut(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("put", endpoint);
  }

  /** Sends a PATCH request */
  public async whenPatch(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("patch", endpoint);
  }

  /** Sends a DELETE request */
  public async whenDelete(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("delete", endpoint);
  }

  /** Sends a HEAD request */
  public async whenHead(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("head", endpoint);
  }

  /** Sends an OPTIONS request */
  public async whenOptions(endpoint: string): Promise<ResponseValidator> {
    return this.sendRequest("options", endpoint);
  }
}
