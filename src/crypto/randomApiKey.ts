const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// 32 bytes = 256 bits, encoded in base64url (~43 chars)
export function randomApiKey(length = 32) {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => alphabet[b % alphabet.length]).join("");
}
