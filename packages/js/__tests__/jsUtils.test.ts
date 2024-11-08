import { describe, expect, it } from 'bun:test'
import { findAsync, isPlainObject, isString } from '../lodash'

const IS_FIXTURES = [
  ['PlainObject', { a: 1 }],
  ['Buffer', Buffer.from('')],
  ['Array', [1]],
  ['String', '1'],
  ['Number', 1],
  ['Null', null],
  ['Undefined', undefined],
  ['Boolean', true],
  ['Function', () => {}],
] as Array<[string, unknown]>

it('findAsync', async () => {
  expect(
    await findAsync([1, 2], async (value, index) => value === 1 && index === 0),
  ).toEqual(1)
})

describe('isString', () => {
  for (const [name, value] of IS_FIXTURES) {
    it(name, () => {
      expect(isString(value)).toEqual(name === 'String')
    })
  }
})

describe('isPlainObject', () => {
  for (const [name, value] of IS_FIXTURES) {
    it(name, () => {
      expect(isPlainObject(value)).toEqual(name === 'PlainObject')
    })
  }
})
