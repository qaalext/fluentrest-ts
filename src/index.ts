export { fluentRest, RestAssured } from "./rest-assured";

// Contracts
export type { RequestBuilder, ResponseValidator } from "./contracts/request-types";

export {
  expectStatus,
  expectBody,
  expectHeader,
  expectBodyContains,
  validateBody
} from "./assertions/assertions";

export { extract } from "./core/utils";

// Logging config types
export type { LogLevel } from "./core/logger";

// Defaults
export { RestAssuredDefaults } from "./core/config";
