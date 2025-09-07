import { serializeError } from '../js/error'

// Response 
//
// { status: 'OK', data: undefined | {} }
// { status: 'ERROR', error: { message, name: undefined, stack, ... }}
//
// okResponse(data | undefined)
// errorResonse(error | string)

export function okResponse(
	data: Record<string, unknown>,
	headers: Record<string, string> = {},
) {
	return jsonResponse({ status: 'OK', data }, headers)
}

export function errorResponse(
	inputError: string | Error,
	headers: Record<string, string> = {},
) {
	let error: Record<string, unknown>
	if (inputError instanceof Error) {
		error = serializeError(inputError)
	} else {
		error = { message: inputError }
	}
	return jsonResponse({ status: 'ERROR', error }, headers)
}

export function jsonResponse(
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
) {
	return new Response(JSON.stringify(body), {
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	})
}
