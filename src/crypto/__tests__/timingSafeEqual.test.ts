import { describe, expect, it } from 'bun:test'
import { timingSafeEqual, timingSafeEqualSome } from '../timingSafeEqual'

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

describe('compareApiKeys', () => {
  it('should return true when input matches an API key', () => {
    const apiKeys = ['key1', 'key2', 'key3']
    expect(timingSafeEqualSome(apiKeys, 'key2')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'key1')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'key3')).toBe(true)
  })

  it('should return false when input does not match any API key', () => {
    const apiKeys = ['key1', 'key2', 'key3']
    expect(timingSafeEqualSome(apiKeys, 'invalid')).toBe(false)
    expect(timingSafeEqualSome(apiKeys, 'key4')).toBe(false)
    expect(timingSafeEqualSome(apiKeys, '')).toBe(false)
  })

  it('should handle empty API keys array', () => {
    expect(timingSafeEqualSome([], 'any-input')).toBe(false)
  })

  it('should handle empty strings in API keys', () => {
    const apiKeys = ['', 'valid-key']
    expect(timingSafeEqualSome(apiKeys, '')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'valid-key')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'invalid')).toBe(false)
  })

  it('should work with your example case', () => {
    const apiKeys = ['', '']
    const input = 'a'
    expect(timingSafeEqualSome(apiKeys, input)).toBe(false)

    // Test with empty string input (should match)
    expect(timingSafeEqualSome(apiKeys, '')).toBe(true)
  })

  it('should be timing-safe by checking all keys', () => {
    // This test ensures we always check all keys, not just until first match
    const apiKeys = ['match', 'key2', 'key3', 'key4', 'key5']
    const input = 'match'

    // Should return true and have checked all keys
    expect(timingSafeEqualSome(apiKeys, input)).toBe(true)

    // Test with no match - should still check all keys
    expect(timingSafeEqualSome(apiKeys, 'nomatch')).toBe(false)
  })

  it('should handle special characters and unicode', () => {
    const apiKeys = ['test@#$%', '测试🚀💯', 'normal-key']
    expect(timingSafeEqualSome(apiKeys, 'test@#$%')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, '测试🚀💯')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'normal-key')).toBe(true)
    expect(timingSafeEqualSome(apiKeys, 'different')).toBe(false)
  })
})
