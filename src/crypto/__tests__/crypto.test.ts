import { describe, expect, it } from 'bun:test'
import { randomNumber } from '../randomNumber'

describe('randomNumber', () => {
  it('should generate different numbers on multiple calls', () => {
    const length = 4
    const results = new Set()

    // Generate 10 numbers and check they're all different
    for (let i = 0; i < 10; i++) {
      results.add(randomNumber(length))
    }

    expect(results.size).toBe(10)
  })

  it('should generate numbers within the correct range', () => {
    const length = 2
    const min = 10 ** (length - 1)
    const max = 10 ** length - 1

    // Generate 100 numbers and verify they're all in range
    for (let i = 0; i < 100; i++) {
      const result = randomNumber(length)
      expect(result).toBeGreaterThanOrEqual(min)
      expect(result).toBeLessThanOrEqual(max)
    }
  })

  it('should handle different length inputs', () => {
    const lengths = [1, 2, 3, 4, 5]

    for (const length of lengths) {
      const result = randomNumber(length)
      expect(result.toString().length).toBe(length)
    }
  })
})
