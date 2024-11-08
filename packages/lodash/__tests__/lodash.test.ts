import { expect, it } from 'bun:test'
import { findAsync } from '../lodash'

it('findAsync', async () => {
  expect(
    await findAsync([1, 2], async (value, index) => value === 1 && index === 0),
  ).toEqual(1)
})
