import { describe, expect, it, spyOn } from 'bun:test'
import { createApi, fetch } from '../fetchUtils'

const BASE_URL = 'https://example.com'

spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
  const result = [input, options]
  return {
    ok: true,
    json: async () => result,
    text: async () => JSON.stringify(result),
  }
})

describe('fetch', () => {
  it('empty options', async () => {
    expect(await fetch(BASE_URL)).toEqual([
      BASE_URL,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    ])
  })

  it('with body', async () => {
    expect(await fetch(BASE_URL, { body: { a: 1 } })).toEqual([
      BASE_URL,
      {
        body: '{"a":1}',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    ])
  })
})

describe('createApi', async () => {
  const api = createApi(BASE_URL)
  expect(await api('/a')).toEqual([
    `${BASE_URL}/a`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ])
})
