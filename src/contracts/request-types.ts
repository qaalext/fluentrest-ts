import { AxiosRequestConfig, AxiosResponse } from "axios";
import Joi from "joi";


// Public interface returned after request execution
export interface ResponseValidator {
  error?: any;
  wasFailure(): boolean;
  getResponse(): AxiosResponse;
  getRequestConfig(): AxiosRequestConfig;

  thenExpectStatus(status: number): this;
  thenExpectBody(path: string, expected: any): this;
  thenExpectBodyContains(fragment: object): this;
  thenValidateBody(schema: Joi.Schema): this;
  thenExpectHeader(key: string, value: string): this;
  thenExtract(path: string): any;

  catchAndLog(fn: () => void): this;
}
