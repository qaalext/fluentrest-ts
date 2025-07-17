import { AxiosProxyConfig } from "axios";
import { LogLevel } from "./logger";

export type ProxyConfig = AxiosProxyConfig | string;


/**
 * Default configuration values for the RestAssured client.
 * Can be overridden globally via environment or locally at runtime.
 */
export type RestAssuredDefaults = {
  timeout: number;
  logLevel: LogLevel;
  logFilePath: string;
  baseUrl: string;
  proxy?: ProxyConfig; 
};

let globalDefaults: RestAssuredDefaults | undefined;
//** Lazy initialization to work with .env file config */
function initDefaults(): RestAssuredDefaults {
  return {
    timeout: Number(process.env.RA_TIMEOUT ?? 10000),
    logLevel: (process.env.RA_LOG_LEVEL as LogLevel) ?? "info",
    logFilePath: process.env.RA_LOG_FILE ?? `logs/restassured-${process.pid}.log`,
    baseUrl: process.env.RA_BASE_URL ?? "https://example.com",
    proxy: process.env.RA_PROXY ?? undefined, // NEW: support env-based proxy
    
  };
  
}

/**
 * Globally override the default configuration.
 * Call this once at the beginning of your test suite if needed.
 *
 * Example:
 *   configureDefaults({ logLevel: "none", timeout: 30000 });
 *
 * @param overrides Partial configuration to apply on top of current defaults
 */

export function configureDefaults(overrides: Partial<RestAssuredDefaults>): void {
  globalDefaults = { ...getCurrentDefaults(), ...overrides };
}


/**
 * Get the current global default configuration.
 * Useful for reading the active settings in internal modules (e.g. logger).
 *
 * Note: Does not merge or clone — returns internal state.
 */
export function getCurrentDefaults(): RestAssuredDefaults {
  if (!globalDefaults) {
    globalDefaults = initDefaults();
  }
  return globalDefaults;
}


/**
 * Merge instance-level overrides with global defaults.
 * Used internally by `fluentRest(...)` and `RestAssuredCore` to create per-request config.
 *
 * @param overrides Optional per-instance overrides
 * @returns A new merged configuration object
 */
export function getMergedDefaults(
  overrides?: Partial<RestAssuredDefaults>
): RestAssuredDefaults {
  return { ...getCurrentDefaults(), ...overrides };
}