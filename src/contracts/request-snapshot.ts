/**
 * Interface for viewing the request details in debug mode
 * Available when creating a request
 */

export interface RequestSnapshot {
    method?: string;
    url?: string;
    headers?: Record<string, any>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
    baseURL?: string;
    status?: number;
    statusText?: string;
  }
  