# rest-assured-fluent-api-ts

A lightweight, chainable TypeScript API testing library inspired by Java's RestAssured. Built with Axios, JSONPath, and Joi for schema validation.


---

## 🚀 Installation

```bash
npm install rest-assured-ts

```
import { requestRA } from 'rest-assured-ts';

```typescript

await requestRA()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenHeader("Accept", "application/json")
  .whenGet("/posts/1")
  .thenExpectStatus(200)
  .thenExpectBody("$.id", 1);

```
<br><br>

-**Set global defaults**
```typescript
import { configureDefaults } from 'rest-assured-ts';

configureDefaults({
  timeout: 30000,
  logLevel: 'debug',
  logFilePath: 'logs/my-run.log',
});

```

<br><br>

-**Global defaults can be set from .env files**
  - RA_TIMEOUT
  - RA_LOG_LEVEL
  - RA_LOG_FILE
  - RA_BASE_URL

<br><br>

-**Chainable API methods available**

| Method                        | Description                              |
|------------------------------|------------------------------------------|
| `.setBaseUrl(url)`           | Set base URL for the request             |
| `.givenHeader(k, v)`         | Add custom headers                       |
| `.givenQueryParam(k, v)`     | Add query string values                  |
| `.givenBody(obj)`            | Add JSON request body                    |
| `.givenFormData(fields)`     | Attach form data or files                |
| `.whenGet(url)`              | Send a GET request                       |
| `.whenPost(url)`             | Send a POST request                      |
| `.whenPut(url)`              | Send a PUT request                       |
| `.whenPatch(url)`            | Send a PATCH request                     |
| `.whenDelete(url)`           | Send a DELETE request                    |
| `.thenExpectStatus(code)`    | Assert HTTP status code                  |
| `.thenExpectHeader(k, v)`    | Assert response header value             |
| `.thenExpectBody(path, val)` | Assert a value via JSONPath              |
| `.thenValidateBody(schema)`  | Validate response body using Joi         |
| `.thenExtract(path)`         | Extract a value from response body       |
| `.getResponse()`             | Get full Axios response object           |


<br><br>

-**Logging-** 
Add log files when needed

```typescript
  await requestRA()
    .enableFileLogging() 
    .setLogLevel("debug")
    .whenGet("/posts/1")
    .thenExpectStatus(200)
```
Log Levels:
- 'debug' – log everything (requests, responses)

- 'info' – general logging

- 'error' – only on failures

- 'none' – silent mode

Logs are automatically grouped per worker when using test runners like Playwright.


<br><br>
- **Designed For:**
  - TypeScript-first API testing
  - Playwright / Jest / Vitest / Mocha integration
  - CI/CD environments (GitHub Actions, GitLab, etc.)
  - People who want fast, clear, and flexible API test syntax
    
<br><br>
 
- **Dependencies**    

| Package        | Purpose                           |
|----------------|-----------------------------------|
| Axios          | HTTP client                       |
| JSONPath-Plus  | Flexible JSON extraction          |
| Joi            | Schema validation                 |
| Form-Data      | For multipart/form-data support   |
| Chalk          | Terminal color logging            |


<br><br>

- **Example Usage**

```typescript

import { requestRA, configureDefaults } from 'rest-assured-ts';

configureDefaults({
  logLevel: "info",
  logFilePath: `logs/test-${process.pid}.log`
});

test("create and retrieve post", async () => {
  const api = await requestRA()
    .setBaseUrl("https://jsonplaceholder.typicode.com")
    .givenBody({ title: "foo", body: "bar", userId: 1 })
    .whenPost("/posts");

  const id = api.thenExtract("$.id");

  await requestRA()
    .setBaseUrl("https://jsonplaceholder.typicode.com")
    .whenGet(`/posts/${id}`)
    .thenExpectStatus(200);
});

```
<br><br>

**License**
MIT- Feel free to use it, extend it

