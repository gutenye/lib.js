const DEFAULT_RETRY = 3
const DEFAULT_RETRY_DELAY = 0
const DEFAULT_RETRY_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504]

export async function fetch<T = any>(
  inputUrl: string | URL,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body: inputBody,
    params,
    retry: inputRetry,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryStatusCodes = DEFAULT_RETRY_STATUS_CODES,
    headers: inputHeaders = {},
    method: inputMethod,
    raw,
    ...inputFetchOptions
  } = options

  const retry = inputRetry ?? DEFAULT_RETRY
  const userSpecifiedRetry = Boolean(inputRetry)

  const url = buildUrl(inputUrl, params)

  const method = inputMethod || (inputBody ? 'POST' : 'GET')

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(inputHeaders instanceof Headers
      ? Object.fromEntries(inputHeaders as any)
      : inputHeaders),
  }

  // Prepare body
  let body: string | undefined
  if (inputBody !== undefined) {
    body = typeof inputBody === 'string' ? inputBody : JSON.stringify(inputBody)
  }

  const fetchOptions: RequestInit = {
    ...inputFetchOptions,
    method,
    headers,
    body,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retry; attempt++) {
    try {
      const response = await globalThis.fetch(url, fetchOptions)

      let data: any
      const text = await response.text()
      try {
        data = text ? JSON.parse(text) : null
      } catch (parseError) {
        // If JSON parsing fails, keep the text as data
        data = text
      }

      if (response.ok) {
        if (!raw) {
          return data as T
        }
        return { ...response, data }
      }

      const error = new FetchError(
        `${method} ${url}: ${response.status} ${response.statusText}`,
        {
          data,
          status: response.status,
          statusText: response.statusText,
          method,
          url,
        },
      )

      // Check if we should retry
      if (
        attempt < retry - 1 &&
        shouldRetry(
          response.status,
          method,
          retryStatusCodes,
          userSpecifiedRetry,
        )
      ) {
        lastError = error
        await sleep(retryDelay)
        continue
      }

      throw error
    } catch (error) {
      if (error instanceof FetchError) {
        throw error
      }

      lastError = error as Error

      // Only retry on network errors for GET requests (or if user specified retry)
      if (
        attempt < retry - 1 &&
        (userSpecifiedRetry || method.toUpperCase() === 'GET')
      ) {
        await sleep(retryDelay)
        continue
      }

      throw error
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed after all retries')
}

/**
 * Create a request function with base configuration
 */
export function createFetch(
  baseUrl: string,
  baseConfig: BaseRequestConfig = {},
): <T = any>(url: string | URL, options?: RequestOptions) => Promise<T> {
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl

  return async <T = any>(
    url: string | URL,
    options: RequestOptions = {},
  ): Promise<T> => {
    // Build full URL
    let fullUrl: string | URL
    if (typeof url === 'string') {
      if (url.startsWith('/')) {
        // Relative path - combine with base URL
        fullUrl = `${normalizedBaseUrl}${url}`
      } else {
        // Absolute URL - use as-is
        fullUrl = url
      }
    } else {
      // URL object - use as-is
      fullUrl = url
    }

    // Merge headers - convert Headers objects to plain objects
    const baseHeaders =
      baseConfig.headers instanceof Headers
        ? Object.fromEntries(baseConfig.headers as any)
        : baseConfig.headers
    const requestHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers as any)
        : options.headers

    const mergedHeaders = {
      ...baseHeaders,
      ...requestHeaders,
    }

    // Merge options with base config
    const mergedOptions: RequestOptions = {
      retry: baseConfig.retry,
      retryDelay: baseConfig.retryDelay,
      retryStatusCodes: baseConfig.retryStatusCodes,
      ...options,
      headers: mergedHeaders,
    }

    return fetch<T>(fullUrl, mergedOptions)
  }
}

/**
 * Serialize URL parameters
 */
function serializeParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * Build URL with parameters
 */
function buildUrl(url: string | URL, params?: Record<string, any>): string {
  const urlObj = new URL(url)

  if (params && Object.keys(params).length > 0) {
    const paramString = serializeParams(params)
    if (paramString) {
      urlObj.search = urlObj.search
        ? `${urlObj.search}&${paramString}`
        : paramString
    }
  }

  return urlObj.toString()
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if a status code should trigger a retry
 */
function shouldRetry(
  status: number,
  method: string,
  retryStatusCodes: number[],
  userSpecifiedRetry: boolean,
): boolean {
  // Only retry GET request by default
  if (userSpecifiedRetry || method.toUpperCase() === 'GET') {
    return retryStatusCodes.includes(status)
  }

  return false
}

export class FetchError extends Error {
  public readonly status: number
  public readonly statusText: string
  public readonly method: string
  public readonly url: string
  public readonly data: any

  constructor(
    message: string,
    {
      data,
      status,
      statusText,
      method,
      url,
    }: {
      data?: any
      status: number
      statusText: string
      method: string
      url: string
    },
  ) {
    super(message)
    this.name = new.target.name
    this.data = data
    this.status = status
    this.statusText = statusText
    this.method = method
    this.url = url
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: any
  params?: Record<string, any>
  retry?: number
  retryDelay?: number
  retryStatusCodes?: number[]
  raw?: boolean
  headers?: HeadersInit
}

export interface BaseRequestConfig {
  headers?: HeadersInit
  retry?: number
  retryDelay?: number
  retryStatusCodes?: number[]
}
