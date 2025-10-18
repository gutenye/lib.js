import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { FetchError, createRequest, request } from '../request'

// Mock fetch function
let mockFetch: any
let fetchCalls: Array<{ url: string; options: RequestInit }>

beforeEach(() => {
  fetchCalls = []
  mockFetch = spyOn(globalThis, 'fetch').mockImplementation(
    async (url: string | URL, options: RequestInit = {}) => {
      fetchCalls.push({ url: url.toString(), options })

      // Default successful response
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true, url: url.toString(), options }),
        text: async () =>
          JSON.stringify({ success: true, url: url.toString(), options }),
      } as Response
    },
  )
})

afterEach(() => {
  mockFetch.mockRestore()
})

describe('request', () => {
  describe('basic functionality', () => {
    it('should make a GET request by default', async () => {
      const result = await request('https://api.example.com/users')

      expect(fetchCalls).toHaveLength(1)
      expect(fetchCalls[0].url).toBe('https://api.example.com/users')
      expect(fetchCalls[0].options.method).toBe('GET')
      expect(fetchCalls[0].options.headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      })
    })

    it('should make a POST request when body is provided', async () => {
      const body = { name: 'John', email: 'john@example.com' }
      await request('https://api.example.com/users', { body })

      expect(fetchCalls).toHaveLength(1)
      expect(fetchCalls[0].options.method).toBe('POST')
      expect(fetchCalls[0].options.body).toBe(JSON.stringify(body))
    })

    it('should allow explicit method override', async () => {
      await request('https://api.example.com/users', {
        method: 'PUT',
        body: { name: 'John' },
      })

      expect(fetchCalls[0].options.method).toBe('PUT')
    })

    it('should handle string body without JSON.stringify', async () => {
      const body = '{"raw":"json"}'
      await request('https://api.example.com/users', { body })

      expect(fetchCalls[0].options.body).toBe(body)
    })
  })

  describe('headers', () => {
    it('should set default JSON headers', async () => {
      await request('https://api.example.com/users')

      expect(fetchCalls[0].options.headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      })
    })

    it('should merge custom headers with defaults', async () => {
      await request('https://api.example.com/users', {
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom': 'value',
        },
      })

      expect(fetchCalls[0].options.headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token123',
        'X-Custom': 'value',
      })
    })

    it('should allow overriding default headers', async () => {
      await request('https://api.example.com/users', {
        headers: {
          'Content-Type': 'text/plain',
        },
      })

      expect(fetchCalls[0].options.headers).toEqual({
        'Content-Type': 'text/plain',
        Accept: 'application/json',
      })
    })
  })

  describe('URL parameters', () => {
    it('should append params to URL', async () => {
      await request('https://api.example.com/users', {
        params: { page: 1, limit: 10 },
      })

      expect(fetchCalls[0].url).toBe(
        'https://api.example.com/users?page=1&limit=10',
      )
    })

    it('should handle existing query parameters', async () => {
      await request('https://api.example.com/users?sort=name', {
        params: { page: 1 },
      })

      expect(fetchCalls[0].url).toBe(
        'https://api.example.com/users?sort=name&page=1',
      )
    })

    it('should skip null and undefined params', async () => {
      await request('https://api.example.com/users', {
        params: {
          page: 1,
          filter: null,
          search: undefined,
          active: true,
        },
      })

      expect(fetchCalls[0].url).toBe(
        'https://api.example.com/users?page=1&active=true',
      )
    })

    it('should convert param values to strings', async () => {
      await request('https://api.example.com/users', {
        params: {
          id: 123,
          active: true,
          score: 4.5,
        },
      })

      expect(fetchCalls[0].url).toBe(
        'https://api.example.com/users?id=123&active=true&score=4.5',
      )
    })
  })

  describe('error handling', () => {
    it('should throw FetchError for HTTP errors', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify({ error: 'User not found' }),
      }))

      try {
        await request('https://api.example.com/users/999')
        expect.unreachable('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError)
        expect(error.message).toBe(
          'GET https://api.example.com/users/999: 404 Not Found',
        )
        expect(error.status).toBe(404)
        expect(error.statusText).toBe('Not Found')
        expect(error.method).toBe('GET')
        expect(error.url).toBe('https://api.example.com/users/999')
        expect(error.data).toEqual({ error: 'User not found' })
      }
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
      }))

      try {
        await request('https://api.example.com/users')
        expect.unreachable('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError)
        expect(error.data).toBe('Server Error') // Now it keeps the text as data
      }
    })

    it('should handle JSON parsing errors in success responses', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => 'Invalid JSON response',
      }))

      const result = await request('https://api.example.com/users')
      // Should return the text when JSON parsing fails
      expect(result).toBe('Invalid JSON response')
    })
  })

  describe('retry logic', () => {
    it('should retry GET requests on retryable status codes', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        if (callCount < 3) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server Error',
          }
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
          text: async () => JSON.stringify({ success: true }),
        }
      })

      const result = await request('https://api.example.com/users', {
        retry: 3,
        retryDelay: 10, // Short delay for testing
      })

      expect(callCount).toBe(3)
      expect(result).toEqual({ success: true })
    })

    it('should not retry POST requests by default', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server Error',
        }
      })

      try {
        await request('https://api.example.com/users', {
          method: 'POST',
          body: { name: 'John' },
          retry: 3,
        })
        expect.unreachable('Should have thrown an error')
      } catch (error) {
        expect(callCount).toBe(1)
        expect(error).toBeInstanceOf(FetchError)
      }
    })

    it('should respect custom retry status codes', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        if (callCount < 2) {
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Not Found',
          }
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
          text: async () => JSON.stringify({ success: true }),
        }
      })

      const result = await request('https://api.example.com/users', {
        retry: 2,
        retryDelay: 10,
        retryStatusCodes: [404],
      })

      expect(callCount).toBe(2)
      expect(result).toEqual({ success: true })
    })

    it('should throw error after max retries', async () => {
      mockFetch.mockImplementation(
        async (url: string | URL, options: RequestInit = {}) => {
          fetchCalls.push({ url: url.toString(), options })
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server Error',
          }
        },
      )

      try {
        await request('https://api.example.com/users', {
          retry: 2,
          retryDelay: 10,
        })
        expect.unreachable('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError)
        expect(fetchCalls).toHaveLength(2)
      }
    })
  })

  describe('TypeScript generics', () => {
    interface User {
      id: number
      name: string
      email: string
    }

    it('should support generic return types', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 1, name: 'John', email: 'john@example.com' }),
        text: async () =>
          JSON.stringify({ id: 1, name: 'John', email: 'john@example.com' }),
      }))

      const user = await request<User>('https://api.example.com/users/1')

      // TypeScript should infer the correct type
      expect(user.id).toBe(1)
      expect(user.name).toBe('John')
      expect(user.email).toBe('john@example.com')
    })
  })
})

describe('createRequest', () => {
  describe('URL building', () => {
    it('should combine base URL with relative paths', async () => {
      const api = createRequest('https://api.example.com')
      await api('/users')

      expect(fetchCalls[0].url).toBe('https://api.example.com/users')
    })

    it('should handle base URL with trailing slash', async () => {
      const api = createRequest('https://api.example.com/')
      await api('/users')

      expect(fetchCalls[0].url).toBe('https://api.example.com/users')
    })

    it('should handle paths without leading slash', async () => {
      const api = createRequest('https://api.example.com')
      await api('users')

      expect(fetchCalls[0].url).toBe('https://api.example.com/users')
    })
  })

  describe('base configuration', () => {
    it('should merge base headers with request headers', async () => {
      const api = createRequest('https://api.example.com', {
        headers: {
          Authorization: 'Bearer token123',
          'X-API-Version': 'v1',
        },
      })

      await api('/users', {
        headers: {
          'X-Request-ID': 'req-456',
          Authorization: 'Bearer token456', // Should override base
        },
      })

      expect(fetchCalls[0].options.headers).toEqual({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token456', // Request header wins
        'X-API-Version': 'v1',
        'X-Request-ID': 'req-456',
      })
    })

    it('should use base retry configuration', async () => {
      let callCount = 0
      mockFetch.mockImplementation(async () => {
        callCount++
        if (callCount < 2) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server Error',
          }
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ success: true }),
          text: async () => JSON.stringify({ success: true }),
        }
      })

      const api = createRequest('https://api.example.com', {
        retry: 2,
        retryDelay: 10,
      })

      const result = await api('/users')

      expect(callCount).toBe(2)
      expect(result).toEqual({ success: true })
    })

    it('should allow request options to override base config', async () => {
      const api = createRequest('https://api.example.com', {
        retry: 5,
        retryDelay: 1000,
      })

      mockFetch.mockImplementation(
        async (url: string | URL, options: RequestInit = {}) => {
          fetchCalls.push({ url: url.toString(), options })
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server Error',
          }
        },
      )

      try {
        await api('/users', {
          retry: 1, // Override base retry
          retryDelay: 10,
        })
        expect.unreachable('Should have thrown an error')
      } catch (error) {
        expect(fetchCalls).toHaveLength(1) // Only 1 attempt due to override
      }
    })
  })

  describe('TypeScript support', () => {
    interface User {
      id: number
      name: string
    }

    it('should support generic types', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: 1, name: 'John' }),
        text: async () => JSON.stringify({ id: 1, name: 'John' }),
      }))

      const api = createRequest('https://api.example.com')
      const user = await api<User>('/users/1')

      expect(user.id).toBe(1)
      expect(user.name).toBe('John')
    })
  })
})

describe('FetchError', () => {
  it('should create error with all properties', () => {
    const error = new FetchError('Test error', {
      data: { error: 'Not found' },
      status: 404,
      statusText: 'Not Found',
      method: 'GET',
      url: 'https://api.example.com/users/999',
    })

    expect(error.name).toBe('FetchError')
    expect(error.message).toBe('Test error')
    expect(error.data).toEqual({ error: 'Not found' })
    expect(error.status).toBe(404)
    expect(error.statusText).toBe('Not Found')
    expect(error.method).toBe('GET')
    expect(error.url).toBe('https://api.example.com/users/999')
    expect(error).toBeInstanceOf(Error)
  })
})
