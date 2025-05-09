import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { logError, logRequest, logResponse, LogLevel } from "./logger";
import { ResponseValidatorImpl } from "./response-validator";

/**
 * Responsible for executing HTTP requests using Axios,
 * capturing both successful and failed responses,
 * and wrapping the result in a ResponseValidator.
 */
export class RequestExecutor {
  constructor(
    private config: Partial<AxiosRequestConfig>,
    private logLevel: LogLevel,
    private logToFile: boolean
  ) {}

  /**
   * Sends the HTTP request using the provided method and endpoint.
   * Ensures that no exception is thrown on non-2xx responses.
   * Returns a ResponseValidator containing the response or error.
   *
   * @param method - HTTP method (e.g., "get", "post", etc.)
   * @param endpoint - Target URL or path
   */
  async send(method: string, endpoint: string): Promise<ResponseValidatorImpl> {
    let response: AxiosResponse | undefined;
    let error: any = null;

    const fullConfig = {
      ...this.config,
      method,
      url: endpoint,
      validateStatus: () => true // never throw on 4xx/5xx
    };

    try {
      logRequest(method, endpoint, fullConfig, this.logLevel, this.logToFile);
      response = await axios.request(fullConfig);
      logResponse(response!, this.logLevel, this.logToFile);
    } catch (err: any) {
      error = err;
      response = err?.response;
      logError(err, "Request Failed", this.logLevel, this.logToFile, response?.data);
    }

    return new ResponseValidatorImpl(response, error, fullConfig, this.logLevel, this.logToFile);
  }

  
 
}
