# Fetch

```ts
import { createRequest } from '#/utils/fetch'
```

## TODO

- request body auto json stringity

use isPlainObject to detect body type

- createRequest supports global options

createRequst(baseUrl, {
	headers: {
		Authorization: 'Bearer TOKEN'
	}
})

createRequst(baseUrl, ({ body }) => ({
	headers: {
		Authorization: createSignature(body)
	}
}))

## createRequest

- Supports baseUrl
- Default header Content-Type is 'application/json'
- method POST if there's a body
- body JSON stringify
- result JSON parse
- better error message when none 2xx response or invalid json response

```ts
const requst = createRequest('https://example.com/api')
const body = await request('/users', { body: { a: 1 } })
```

## request

```ts
const body = await request('https://example.com/api/users')
```