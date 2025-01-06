import { describe, expect, it, spyOn } from 'bun:test'
import { createRequest, request } from '../fetch'

const BASE_URL = 'https://example.com/v1'

spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
  const result = [input.toString(), options]
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

describe('createRequest', () => {
  it('works', async () => {
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

  it('path traversal attack', async () => {
    const api = createRequest(BASE_URL)
    expect((await api('/../../a'))[0]).toEqual(`${new URL(BASE_URL).origin}/a`)
  })
})
