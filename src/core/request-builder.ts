import { AxiosProxyConfig, AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import FormData from "form-data";
import fs from "fs";
import { RequestExecutor } from "./request-executor";
import { getMergedDefaults, ProxyConfig, RestAssuredDefaults } from "./config";
import { LogLevel } from "./logger";
import { RequestSnapshot } from "../contracts/request-snapshot";
import { ResponseValidator } from "../contracts/response-validator-type";
import qs from "qs"

/**
 * A fluent builder for configuring HTTP requests.
 * Provides `given*` and `when*` methods to define and trigger requests.
 */
export class RequestBuilder {
  protected config: Partial<AxiosRequestConfig> = {};
  protected logToFile = false;
  protected logLevel: LogLevel = "info";
  private proxyOverride?: AxiosProxyConfig;
  private proxyAgent?: any; // Type from HttpsProxyAgent constructor

  constructor(overrides: Partial<RestAssuredDefaults> = {}) {
  const defaults = getMergedDefaults(overrides);
  this.config.baseURL = defaults.baseUrl;
  this.config.timeout = defaults.timeout;
  this.logLevel = defaults.logLevel;
  this.logToFile = false;
  this.applyProxy(defaults.proxy);
  
  
}
/** 
 * Update the constructor to always call a utility method that handles the logic for proxy setup.
*/
  private applyProxy(proxy: ProxyConfig | undefined) {
  if (!proxy) return;

  if (typeof proxy === "string") {
    const agent = new HttpsProxyAgent(proxy);

    // Inspect base URL or proxy protocol to determine correct assignment
    const isHttpsProxy = proxy.startsWith("https://");

    this.proxyAgent = agent;
    this.proxyOverride = undefined;

    // PROTOCOL-AWARE assignment
    this.config.httpAgent = isHttpsProxy ? undefined : agent;
    this.config.httpsAgent = isHttpsProxy ? agent : undefined;

  } else if (proxy.host && proxy.port) {
    // Classic Axios proxy config
    this.proxyOverride = proxy;
    this.proxyAgent = undefined;

    // Clear both agents when classic config is used
    delete this.config.httpAgent;
    delete this.config.httpsAgent;

    this.config.proxy = this.proxyOverride;
  }
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

  /**
   * Sets a proxy for this request.
   * Accepts either an Axios proxy config object or a proxy URL (for HTTPS tunneling).
   *
   * @param proxy Axios proxy config object or proxy URL string
   */
  setProxy(proxy: AxiosProxyConfig | string): this {

  if (typeof proxy === "string" && !/^https?:\/\//.test(proxy)) {
    throw new Error(`Invalid proxy URL: "${proxy}". Must start with http:// or https://`);
  }
  if (typeof proxy !== "string" && (!proxy.host || !proxy.port)) {
    throw new Error(`Invalid Axios proxy config. Must include 'host' and 'port'.`);
  }

  this.applyProxy(proxy);
  return this;
  
}

  /** Removes all proxy config (agent or classic Axios-style) for this request. */
  clearProxy(): this {
  
    this.proxyOverride = undefined;
    this.proxyAgent = undefined;
    delete this.config.proxy;
    delete this.config.httpAgent;
    delete this.config.httpsAgent;
    return this;
  
  }
  /** Enables or disables file-based logging. */
  enableFileLogging(enable: boolean): this {
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

  /**
   * Adds a JSON request body.
   * Adds a JSON string body
   * Adds multipart form-data from file paths or strings.
   * Automatically attaches files if they exist on disk.
   */
  givenBody(body: any, contentType: string = "application/json"): this {
  switch (contentType) {
    case "application/json":
      this.config.data = typeof body === "string" ? body : JSON.stringify(body);
      break;

    case "application/x-www-form-urlencoded":
      this.config.data = typeof body === "string" ? body : qs.stringify(body);
      break;

    case "multipart/form-data":
      const form = new FormData();
      for (const key in body) {
        const value = body[key];
        const isFile = fs.existsSync(value);
        form.append(key, isFile ? fs.createReadStream(value) : value);
      }
      this.config.data = form;
      this.config.headers = {
        ...this.config.headers,
        ...form.getHeaders(),
      };
      break;

    default:
      this.config.data = body;
  }

  if (contentType !== "multipart/form-data") {
    this.config.headers = {
      ...this.config.headers,
      "Content-Type": contentType,
    };
  }

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

  /**
 * Sends a GET request to the specified endpoint using the current request configuration.
 * Returns a ResponseValidator which allows chaining expectations.
 *
 * @example
 * const response = await fluentRest().whenGet("/users/1");
 */
  async whenGet(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "get",
      endpoint,
      overrides
    );
  }

  /**
 * Sends a POST request to the specified endpoint with the current configuration.
 * Use `givenBody()` before this to attach a payload.
 *
 * @example
 * const response = await fluentRest().givenBody({ name: "John" }).whenPost("/users");
 */
  async whenPost(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "post",
      endpoint,
      overrides
    );
  }

  /**
 * Sends a PUT request to the specified endpoint using the current request configuration.
 * Typically used for full updates to a resource.
 */
  async whenPut(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "put",
      endpoint,
      overrides
    );
  }

  /**
 * Sends a DELETE request to the specified endpoint.
 * Useful for resource cleanup or deletion tests.
 */
  async whenDelete(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;
    
    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "delete",
      endpoint,
      overrides
    );
  }

  /**
 * Sends a PATCH request to the specified endpoint using the current request configuration.
 * Typically used for partial updates to a resource.
 */
  async whenPatch(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "patch",
      endpoint,
      overrides
    );
  }

  /**
 * Sends a HEAD request to the given endpoint using the current builder configuration.
 * @param endpoint - The API endpoint path to send the request to.
 * @returns A ResponseValidator for performing post-response assertions.
 */
  async whenHead(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "head",
      endpoint,
      overrides
    );
  }

  /**
 * Sends an OPTIONS request to the given endpoint using the current builder configuration.
 * @param endpoint - The API endpoint path to send the request to.
 * @returns A ResponseValidator for performing post-response assertions.
 */
  async whenOptions(endpoint: string) {
    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    return new RequestExecutor(this.config, this.logLevel, this.logToFile).send(
      "options",
      endpoint,
      overrides
    );
  }

  /**
 * Returns the underlying Axios request configuration used in the builder including proxy settings.
 * Useful for debugging or inspection.
 * @returns The AxiosRequestConfig used in the current request builder.
 */
  public getConfig(): AxiosRequestConfig {
    return {
      ...this.config,
      ...(this.proxyOverride ? { proxy: this.proxyOverride } : {}),
      ...(this.proxyAgent ? { httpAgent: this.proxyAgent, httpsAgent: this.proxyAgent } : {}),
    };
  }

  /**
 * Returns the log level configured for this builder instance.
 * Useful to determine logging behavior in tests.
 * @returns The active LogLevel (e.g., 'debug', 'info', 'none').
 */
  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
 * Indicates whether logging to file is enabled for this builder instance.
 * @returns True if logs should be persisted to file, false otherwise.
 */
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

    const overrides = this.proxyOverride ? { proxy: this.proxyOverride } : undefined;

    const responseValidator = await executor.send(method, endpoint, overrides);

    // Pass response to assertion function
    expect(responseValidator);
  }
}
