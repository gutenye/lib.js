# Request Utility

A comprehensive HTTP request utility with JSON support, retry logic, TypeScript generics, error handling, and parameter serialization.

## Features

- ✅ **JSON Support**: Auto-detect POST method, JSON serialization, proper headers
- ✅ **Factory Function**: Create request instances with base URL and configuration
- ✅ **TypeScript Generics**: Full type safety for request/response data
- ✅ **Custom Error Handling**: Detailed error information with parsed response data
- ✅ **Retry Logic**: Smart retry for GET requests on specific status codes
- ✅ **URL Parameters**: Automatic parameter serialization

## Basic Usage

```typescript
import { request, createRequest } from './request'

// Simple GET request
const users = await request<User[]>('https://api.example.com/users')

// POST request with JSON body (auto-detected)
const newUser = await request<User>('https://api.example.com/users', {
  body: { name: 'John', email: 'john@example.com' }
})

// GET request with parameters
const filteredUsers = await request<User[]>('https://api.example.com/users', {
  params: { page: 1, limit: 10, active: true }
})
// Results in: https://api.example.com/users?page=1&limit=10&active=true
```

## Factory Function

```typescript
// Create a request instance with base configuration
const api = createRequest('https://api.example.com', {
  headers: {
    'Authorization': 'Bearer your-token',
    'X-API-Version': 'v1'
  },
  retry: 3,
  retryDelay: 1000
})

// Use the configured instance
const users = await api<User[]>('/users')
const user = await api<User>('/users/123')

// Override base configuration per request
const urgentRequest = await api<Data>('/urgent-data', {
  retry: 1,
  headers: { 'Priority': 'high' }
})
```

## Error Handling

```typescript
import { FetchError } from './request'

try {
  const data = await request('https://api.example.com/users/999')
} catch (error) {
  if (error instanceof FetchError) {
    console.log('Status:', error.status)        // 404
    console.log('Method:', error.method)        // 'GET'
    console.log('URL:', error.url)              // Full URL
    console.log('Response data:', error.data)   // Parsed JSON response
  }
}
```

## Retry Configuration

```typescript
// Custom retry settings
const data = await request('https://api.example.com/data', {
  retry: 5,                    // Total attempts (default: 3)
  retryDelay: 2000,           // Delay between retries (default: 1000ms)
  retryStatusCodes: [408, 429, 500, 502, 503, 504] // Custom retry codes
})

// Retry only applies to GET requests on specific status codes:
// 408 - Request Timeout
// 409 - Conflict  
// 425 - Too Early
// 429 - Too Many Requests
// 500 - Internal Server Error
// 502 - Bad Gateway
// 503 - Service Unavailable
// 504 - Gateway Timeout
```

## Advanced Options

```typescript
// All available options
const response = await request<ApiResponse>('https://api.example.com/data', {
  method: 'PUT',                    // Override auto-detected method
  body: { data: 'value' },         // Auto JSON.stringify for objects
  headers: {                       // Custom headers (merged with defaults)
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer token'
  },
  params: {                        // URL parameters
    filter: 'active',
    sort: 'name'
  },
  retry: 3,                        // Retry attempts
  retryDelay: 1000,               // Delay between retries
  retryStatusCodes: [500, 502],   // Custom retry status codes
  // ... any other fetch options
  signal: abortController.signal,
  credentials: 'include'
})
```

## TypeScript Support

```typescript
interface User {
  id: number
  name: string
  email: string
}

interface CreateUserRequest {
  name: string
  email: string
}

// Fully typed request and response
const user = await request<User>('https://api.example.com/users/1')
// user is typed as User

const newUser = await request<User>('https://api.example.com/users', {
  body: { name: 'John', email: 'john@example.com' } as CreateUserRequest
})
// newUser is typed as User
```

## Error Types

The `FetchError` class provides detailed error information:

```typescript
class FetchError extends Error {
  readonly status: number      // HTTP status code
  readonly statusText: string  // HTTP status text
  readonly method: string      // Request method
  readonly url: string         // Full request URL
  readonly data: any          // Parsed response data (if available)
}
```