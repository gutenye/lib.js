export function randomNumber(length: number) {
  const start = 10 ** (length - 1)
  return (crypto.getRandomValues(new Uint32Array(1))[0] % (9 * start)) + start
}
