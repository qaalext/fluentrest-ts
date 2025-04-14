import { JSONPath } from "jsonpath-plus";
import { AxiosResponse } from "axios";

export function extract(response: AxiosResponse, path: string): any {
    const result = JSONPath({ path, json: response.data });
    return result.length ? result[0] : undefined;
  }
