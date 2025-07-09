
# fluentrest-ts

A lightweight, fluent TypeScript API testing library inspired by Java's RestAssured. Built on top of Axios, JSONPath, and Joi for powerful request handling and response validation.

---

## 📦 Installation

```bash
npm install fluentrest-ts
```

---

## 🚀 Quick Start

```ts
import { fluentRest } from "fluentrest-ts";

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

## 🔁 Fluent API Overview

| Method | Description |
|--------|-------------|
| `setBaseUrl(url)` | Sets the base URL |
| `setTimeout(ms)` | Overrides timeout |
| `setLogLevel(level)` | Sets log verbosity ("debug" \| "info" \| "none") |
| `enableFileLogging(bool)` | Enables or disables file-based logging |
| `givenHeader(key, value)` | Adds a request header |
| `givenQueryParam(key, value)` | Adds a query parameter |
| `givenBody(obj)` | Sets JSON request body |
| `givenFormData(fields)` | Attaches multipart form-data or files |
| `debug()` | Prints current config to console |
| `getSnapshot()` | Returns snapshot of current request config |
| `whenGet(url)` | Sends a GET request |
| `whenPost(url)` | Sends a POST request |
| `whenPut(url)` | Sends a PUT request |
| `whenPatch(url)` | Sends a PATCH request |
| `whenDelete(url)` | Sends a DELETE request |
| `whenHead(url)` | Sends a HEAD request |
| `whenOptions(url)` | Sends an OPTIONS request |
| `sendAndExpect(method, url, fn, overrides?)` | Sends a request and runs assertions |

---

## ✅ Response Validator API

After each request, you receive a `ResponseValidator` object with the following methods:

| Method | Description |
|--------|-------------|
| `thenExpectStatus(code)` | Assert HTTP status code |
| `thenExpectBody(path, val)` | Assert JSONPath value |
| `thenExpectBodyContains(fragment)` | Assert body contains key-values |
| `thenValidateBody(schema)` | Joi schema validation |
| `thenExpectHeader(k, v)` | Assert response header |
| `thenExtract(path)` | Extract JSONPath value |
| `catchAndLog(fn)` | Wrap and log assertion failures |
| `getResponse()` | Raw Axios response |
| `getRequestConfig()` | Request config used |
| `wasFailure()` | True if request failed |

---

## 🧪 Examples by Method

### POST with JSON and Assertions
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenBody({ title: "foo", body: "bar", userId: 1 })
  .whenPost("/posts")
  .thenExpectStatus(201)
  .thenExpectBody("$.title", "foo");
```

### GET with Query Params
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenQueryParam("userId", "1")
  .whenGet("/posts")
  .thenExpectStatus(200);
```

### PUT with Header
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenHeader("Authorization", "Bearer token")
  .givenBody({ title: "updated title" })
  .whenPut("/posts/1")
  .thenExpectStatus(200);
```

### PATCH and Body Fragment Check
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenBody({ title: "patched" })
  .whenPatch("/posts/1")
  .thenExpectBodyContains({ title: "patched" });
```

### DELETE
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenDelete("/posts/1")
  .thenExpectStatus(200);
```

### HEAD
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenHead("/posts/1")
  .thenExpectStatus(200);
```

### OPTIONS
```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenOptions("/posts")
  .thenExpectStatus(204);
```

---

## 🧩 Logging

```ts
await fluentRest()
  .enableFileLogging(true)
  .setLogLevel("debug")
  .whenGet("/posts/1")
  .thenExpectStatus(200);
```

**Log levels:**
- `"debug"` – log everything
- `"info"` – request + response
- `"none"` – silence

Logs are written to `logs/restassured-<pid>.log` by default unless overridden via `configureDefaults`.

---

## 🛠️ Global Defaults

```ts
import { configureDefaults } from "fluentrest-ts";

configureDefaults({
  timeout: 15000,
  logLevel: "info",
  logFilePath: "logs/custom.log",
});
```

You may also use `.env` variables:

```
RA_TIMEOUT=20000
RA_LOG_LEVEL=debug
RA_LOG_FILE=logs/run.log
RA_BASE_URL=https://jsonplaceholder.typicode.com
```

> Ensure `.env` is loaded **before** any `fluentrest-ts` import.

---

## 📤 Combined Send & Assert (Compact Tests)

```ts
await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .sendAndExpect("post", "/posts", res => {
    res.thenExpectStatus(201).thenExpectBody("$.title", "foo");
  }, {
    headers: { "Content-Type": "application/json" },
    body: { title: "foo", body: "bar", userId: 1 }
  });
```


## 🛡️ Assertion Wrapper: `catchAndLog()`

Use `catchAndLog()` to wrap custom assertions or logic. If it throws, the error will be logged with context.

```ts
const response = await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenGet("/posts/1");

response.catchAndLog(() => {
  const body = response.thenExtract("$.body");
  if (!body || body.length < 10) {
    throw new Error("Body is unexpectedly short");
  }
});
```

This is useful for edge-case checks or combining your own logic with the library’s logging system.

---

## 🧪 Extract and Reuse Response Data

```ts
const post = await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenBody({ title: "foo", body: "bar", userId: 1 })
  .whenPost("/posts");

const id = post.thenExtract("$.id");

await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenGet(`/posts/${id}`)
  .thenExpectStatus(200);
```


## 🧪 Joi Schema Validation Example

Use Joi to validate the full response body structure:

```ts
import Joi from "joi";

const schema = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  userId: Joi.number().required()
});

await fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .whenGet("/posts/1")
  .thenValidateBody(schema);
```


---

## 🔍 Debugging

To inspect the request before sending:

```ts
fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenBody({ name: "debug" })
  .debug();
```


---

## 🧩 Request Snapshot Debugging

You can print or retrieve a snapshot of the full request configuration:

```ts
const builder = fluentRest()
  .setBaseUrl("https://jsonplaceholder.typicode.com")
  .givenHeader("X-Debug", "true")
  .givenQueryParam("debug", "1");

builder.debug(); // Console output

const snapshot = builder.getSnapshot();
console.log("Snapshot method:", snapshot.method);
```

This is useful for troubleshooting test cases, comparing requests, or snapshot testing.

---

## 🌐 Proxy Support

### 🔧 Global Proxy Configuration

Apply a proxy to all requests by default:

```ts
configureDefaults({
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  }
});
```

---

### 🚀 Per-Request Proxy Override

Override the global proxy using `.setProxy()`:

```ts
const response = await fluentRest()
  .setProxy({
    host: 'custom.proxy.com',
    port: 3128,
    auth: {
      username: 'customUser',
      password: 'customPass'
    }
  })
  .whenGet('/posts/1');
```

---

### 🛑 Disabling Proxy for a Specific Request

Disable proxy even if one is globally configured:

```ts
const response = await fluentRest()
  .clearProxy()
  .whenGet('/health');
```

---

### 🔁 Proxy Resolution Order

1. `setProxy(...)` – per-request override
2. `configureDefaults(...)` – global default
3. No proxy – if `.clearProxy()` is used

---

### 📦 Proxy Object Format

The proxy object must match Axios's format:

```ts
{
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: 'http' | 'https';
}
```

---



## 🔍 Utilities and Tools

- `configureDefaults()` – Global config via code
- `.env` support – Set RA_TIMEOUT, RA_LOG_LEVEL, etc.
- `debug()` – Print live config to terminal
- `getSnapshot()` – Inspect request config object
- `thenExtract(path)` – Pull specific data from response
- `catchAndLog(fn)` – Wrap and log assertion errors with context



---

## 🧱 Designed For

- TypeScript-first testing
- Frameworks like Playwright / Vitest / Jest / Mocha
- CI/CD environments
- Readable and compact API test syntax

---

## 📦 Dependencies

| Package        | Purpose                           |
|----------------|-----------------------------------|
| Axios          | HTTP client                       |
| JSONPath-Plus  | JSON extraction from response     |
| Joi            | Schema validation                 |
| Form-Data      | Multipart/form-data support       |
| Chalk          | Terminal logging colors           |

---

## 📄 License

MIT – Use, extend, and enjoy!

---