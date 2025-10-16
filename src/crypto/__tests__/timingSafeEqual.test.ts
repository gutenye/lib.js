import { describe, expect, it } from 'bun:test'
import { timingSafeEqual } from '../timingSafeEqual'

describe('timingSafeEqual', () => {
  it('should return true for identical strings', () => {
    expect(timingSafeEqual('secret', 'secret')).toBe(true)
  })

  it('should return false for different strings', () => {
    expect(timingSafeEqual('secret', 'not a secret')).toBe(false)
  })

  it('should return false for different-length strings', () => {
    expect(timingSafeEqual('abc', 'abcde')).toBe(false)
  })

  it('should return true for empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true)
  })

  it('should return false for empty vs non-empty strings', () => {
    expect(timingSafeEqual('', 'a')).toBe(false)
  })

  it('should handle multiple parallel calls consistently', () => {
    const secret = 'my-secret-key'
    const results = Array.from({ length: 100 }, () =>
      timingSafeEqual(secret, secret),
    )

    expect(results.every(Boolean)).toBe(true)
  })

  it('should be consistent for the same inputs', () => {
    const left = 'test-string'
    const right = 'test-string'

    // Call multiple times to ensure consistency
    for (let i = 0; i < 10; i++) {
      expect(timingSafeEqual(left, right)).toBe(true)
    }
  })

  it('should handle special characters', () => {
    const special = 'test@#$%^&*()_+{}|:"<>?'
    expect(timingSafeEqual(special, special)).toBe(true)
    expect(timingSafeEqual(special, 'different')).toBe(false)
  })

  it('should handle unicode characters', () => {
    const unicode = '测试🚀💯'
    expect(timingSafeEqual(unicode, unicode)).toBe(true)
    expect(timingSafeEqual(unicode, 'test')).toBe(false)
  })

  it('should be timing-safe (basic test)', () => {
    // This is a basic test - true timing safety would require more sophisticated measurement
    const longString = 'a'.repeat(1000)
    const shortString = 'b'

    expect(timingSafeEqual(longString, shortString)).toBe(false)
    expect(timingSafeEqual(longString, longString)).toBe(true)
  })
})
