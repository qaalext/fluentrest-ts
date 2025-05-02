import { JSONPath } from "jsonpath-plus";
import { AxiosResponse } from "axios";

/**
 * Extracts a value from the Axios response body using a JSONPath expression.
 * @param response - Axios response
 * @param path - JSONPath string expression
 * @returns The first match from the path, or undefined
 */
export function extract(response: AxiosResponse, path: string): any {
  const result = JSONPath({ path, json: response.data });
  return result.length ? result[0] : undefined;
}
