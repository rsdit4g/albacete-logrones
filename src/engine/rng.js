// mulberry32: tiny deterministic PRNG, returns () => float in [0,1)
export function createRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper: integer in [min, max] inclusive
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
