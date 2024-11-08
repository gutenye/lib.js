export async function fetch(
  input: FetchArgs[0],
  { method, body, headers, ...rest }: FetchArgs[1] = {},
) {
  const options: FetchArgs[1] = { ...rest }
  const newMethod = method || body ? 'POST' : undefined
  if (newMethod) {
    options.method = newMethod
  }
  const newBody = body ? JSON.stringify(body) : undefined
  if (newBody) {
    options.body = newBody
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
      `Fetch ${res.status} ${res.statusText || ''} ${input} ${text}`,
    )
  }
  return await res.json()
}

export function createApi(baseUrl: string) {
  return async function request(input: FetchArgs[0], options?: FetchArgs[1]) {
    const newInput =
      typeof input === 'string' && input.startsWith('/')
        ? `${baseUrl}${input}`
        : input
    return fetch(newInput, options)
  }
}

type FetchArgs = Parameters<typeof globalThis.fetch>
