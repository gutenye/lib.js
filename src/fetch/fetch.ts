export async function request(
  input: FetchArgs[0],
  { method, body, headers, ...rest }: FetchArgs[1] = {},
) {
  const options: FetchArgs[1] = { ...rest }
  if (body) {
    options.method = method || 'POST'
  }
  if (body) {
    options.body = typeof body === 'object' ? JSON.stringify(body) : body
  }
  const newHeaders =
    headers instanceof Headers ? Object.fromEntries(headers) : headers
  options.headers = {
    'Content-Type': 'application/json',
    ...newHeaders,
  }
  const res = await globalThis.fetch(input, options)
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200)
    throw new Error(
      `[request] ${res.status} ${res.statusText || ''} from '${input}' with '${text}'`,
    )
  }
  try {
    return await res.json()
  } catch (err) {
    const text = (await res.text()).slice(0, 200)
    throw new Error(`[request] Invalid JSON from '${input}' with '${text}'`)
  }
}

export function createRequest(baseUrl: string) {
  return async function requestWrapper(
    input: FetchArgs[0],
    options?: FetchArgs[1],
  ) {
    const newInput =
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, baseUrl)
        : input
    return request(newInput, options)
  }
}

type FetchArgs = Parameters<typeof globalThis.fetch>
