import { RequestBuilder } from "./core/request-builder";
import { configureDefaults, RestAssuredDefaults } from "./core/config";


// Type-only export for autocompletion and config assistance
export type { RestAssuredDefaults } from "./core/config";
export type { RequestSnapshot } from "./contracts/request-snapshot";
export type { ResponseValidator } from './contracts/response-validator-type';
/**
 * Entry point to create a new request builder instance.
 * Optionally accepts overrides to the default configuration.
 *
 * @example
 * const res = await fluentRest()
 *   .setBaseUrl("https://jsonplaceholder.typicode.com")
 *   .givenBody({ title: "foo" })
 *   .whenPost("/posts");
 */
export const fluentRest = (overrides?: Partial<RestAssuredDefaults>) => {
  return new RequestBuilder(overrides);
};

/**
 * Updates the default global configuration for all requests.
 *
 * @example
 * configureDefaults({ timeout: 30000, logLevel: "debug" });
 */
export { configureDefaults, RequestBuilder };
