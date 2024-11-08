import { describe, expect, it, spyOn } from 'bun:test'
import { createRequest, request } from '../fetchUtils'

const BASE_URL = 'https://example.com'

spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
  const result = [input, options]
  return {
    ok: true,
    json: async () => result,
    text: async () => JSON.stringify(result),
  }
})

describe('request', () => {
  it('empty options', async () => {
    expect(await request(BASE_URL)).toEqual([
      BASE_URL,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    ])
  })

  it('with body', async () => {
    expect(await request(BASE_URL, { body: { a: 1 } })).toEqual([
      BASE_URL,
      {
        body: '{"a":1}',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    ])
  })
})

describe('createRequest', async () => {
  const api = createRequest(BASE_URL)
  expect(await api('/a')).toEqual([
    `${BASE_URL}/a`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ])
})
