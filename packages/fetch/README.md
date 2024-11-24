TODO

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