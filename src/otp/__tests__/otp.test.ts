import { describe, expect, it } from 'bun:test'
import { generateOtp } from '../otp'

describe('generateOtp', () => {
  it('generates OTP with correct length', () => {
    expect(generateOtp(4)).toHaveLength(4)
    expect(generateOtp(5)).toHaveLength(5)
    expect(generateOtp(6)).toHaveLength(6)
  })

  it('throws error for invalid lengths', () => {
    expect(() => generateOtp(3)).toThrow('OTP length must be between 4 and 6.')
    expect(() => generateOtp(7)).toThrow('OTP length must be between 4 and 6.')
  })

  it('generates numeric OTP', () => {
    const otp = generateOtp(6)
    expect(otp).toMatch(/^\d{6}$/) // regex checks if OTP is exactly 6 digits
  })

  it('OTP is different each time (probabilistic)', () => {
    const otps = new Set()
    for (let i = 0; i < 10; i++) {
      otps.add(generateOtp(6))
    }
    // Not guaranteed, but extremely unlikely that all are identical
    expect(otps.size).toBeGreaterThan(1)
  })
})
