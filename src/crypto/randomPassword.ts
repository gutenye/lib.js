const lower  = "abcdefghijklmnopqrstuvwxyz";
const upper  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digits = "0123456789";

// output: zuqWan-fajguw-4wojha
// 20 chars, 1 digit, 1 uppercase, 2 hyphens, 16 lowercase
export function randomPassword() {
  // three groups of 6 lowercase chars
  const groups = [randomLower(6), randomLower(6), randomLower(6)];

  // choose random (group, pos) for the uppercase
  const gU = randInt(3), pU = randInt(6);
  groups[gU][pU] = pick(upper);

  // choose random (group, pos) for the digit; ensure it doesn't collide with the uppercase
  let gD = randInt(3), pD = randInt(6);
  while (gD === gU && pD === pU) {        // avoid overwriting the uppercase
    gD = randInt(3);
    pD = randInt(6);
  }
  groups[gD][pD] = pick(digits);

  // join to final form: xxxxxx-xxxxxx-xxxxxx
  return groups.map(a => a.join("")).join("-");
}

// unbiased secure integer in [0, max)
function randInt(max) {
  if (max <= 0) throw new Error("max must be > 0");
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < range) return buf[0] % max;
  }
}
const pick = s => s[randInt(s.length)];

function randomLower(len) {
  return Array.from({ length: len }, () => pick(lower));
}
