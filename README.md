# fluentrest-ts

A lightweight, chainable TypeScript API testing library inspired by Java's RestAssured. Built with Axios, JSONPath, and Joi for schema validation.

---

##  Installation

```bash
npm install fluentrest-ts
```

---

##  Basic Usage

```ts
import { fluentRest } from 'fluentrest-ts';

const response = await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenHeader("Accept", "application/json")
  .whenGet("/posts/1");

response
  .thenExpectStatus(200)
  .thenExpectBody("$.id", 1);
```

> ❗️ Note: `thenExpectX` methods require the result of a request (you must `await` the `whenX()` call).

---

##  Convenience: Send and Assert in One Step

Use `sendAndExpect()` when you want to skip the variable and assert directly:

```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .sendAndExpect("post", "/posts", res => {
    res
      .thenExpectStatus(201)
      .thenExpectBody("$.title", "foo");
  }, {
    headers: { "Content-Type": "application/json" },
    body: { title: "foo", body: "bar", userId: 1 }
  });
```

---

##  Example: Dynamic Method with Query Params

```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .sendAndExpect("get", "/posts", res => {
    res.thenExpectStatus(200);
  }, {
    params: { userId: 1 }
  });
```

---

##  Global Defaults

```ts
import { configureDefaults } from 'fluentrest-ts';

configureDefaults({
  timeout: 30000,
  logLevel: 'debug',
  logFilePath: 'logs/my-run.log',
});
```

Or from `.env`:
- `RA_TIMEOUT`
- `RA_LOG_LEVEL`
- `RA_LOG_FILE`
- `RA_BASE_URL`

---

##  Chainable Methods

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
| `.catchAndLog(fn)`           | Log and rethrow user-defined assertion   |
| `.sendAndExpect(...)`        | One-shot request + assertion helper      |

---

##  Logging

```ts
await fluentRest()
  .enableFileLogging()
  .setLogLevel("debug")
  .whenGet("/posts/1")
  .thenExpectStatus(200);
```

**Log Levels:**
- `'debug'` – request + response + assertions
- `'info'` – request + response
- `'none'` – silent

Logs are grouped by worker for test runners like Playwright or Vitest.

---

##  Example with Variable + Extract

```ts
import { fluentRest } from 'fluentrest-ts';

const post = await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenBody({ title: "foo", body: "bar", userId: 1 })
  .whenPost("/posts");

const id = post.thenExtract("$.id");

const verify = await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenGet(`/posts/${id}`);

verify.thenExpectStatus(200);
```

---

##  Designed For

- TypeScript-first API testing
- Playwright / Jest / Vitest / Mocha
- CI/CD pipelines (GitHub Actions, GitLab, etc.)
- Fluent and clear test syntax

---

##  Dependencies

| Package        | Purpose                           |
|----------------|-----------------------------------|
| Axios          | HTTP client                       |
| JSONPath-Plus  | Flexible JSON extraction          |
| Joi            | Schema validation                 |
| Form-Data      | Multipart/form-data support       |
| Chalk          | Terminal logging colors           |

---

##  License

MIT – Use, extend, and enjoy!
