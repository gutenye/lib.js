// see learn/medusa/otp

const LENGTH = 4
const MAX_ATTEMPTS = 3
const EXPIRES_IN = 5 * 60 * 1000 // 5 minutes

export class Otp {
  #store: Map<string, OtpEntry> = new Map()

  // Generate secure numeric OTP code with length of 4–6 digits
  static generateOtp(length: number): string {
    if (length < 4 || length > 6) {
      throw new Error('generateOtp: length must be between 4 and 6.')
    }
    const max = 10 ** length
    const randomNumber = crypto.getRandomValues(new Uint32Array(1))[0]
    return (randomNumber % max).toString().padStart(length, '0')
  }

  create(
    id: string,
    length = LENGTH,
    maxAttempts = MAX_ATTEMPTS,
    expiresIn = EXPIRES_IN,
  ): string {
    const code = Otp.generateOtp(length)
    const expiresAt = Date.now() + expiresIn
    this.#store.set(id, { code, attempts: 0, maxAttempts, expiresAt })
    return code
  }

  verifyOtp(id: string, code: string): boolean {
    const entry = this.#store.get(id)

    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiresAt || entry.attempts >= entry.maxAttempts) {
      this.#store.delete(id)
      return false
    }

    if (entry.code === code) {
      this.#store.delete(id)
      return true
    } else {
      entry.attempts += 1
      return false
    }
  }
}

interface OtpEntry {
  code: string
  attempts: number
  maxAttempts: number
  expiresAt: number
}
