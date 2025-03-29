// Generate secure numeric OTP code with length of 4–6 digits
export function generateOtp(length: number) {
  if (length < 4 || length > 6) {
    throw new Error('generateOtp length must be between 4 and 6.')
  }
  const max = 10 ** length
  const randomNumber = crypto.getRandomValues(new Uint32Array(1))[0]
  return (randomNumber % max).toString().padStart(length, '0')
}
