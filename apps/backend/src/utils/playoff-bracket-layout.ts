const isPowerOfTwo = (n: number): boolean =>
  Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;

export function getBracketSizeFromMaxSeed(maxSeed: number): number {
  if (!Number.isFinite(maxSeed) || maxSeed <= 0) return 0;
  return Math.pow(2, Math.ceil(Math.log2(maxSeed)));
}

/**
 * Returns the seed ordering used to place seeds into bracket leaf positions.
 * Example for 8: [1, 8, 4, 5, 2, 7, 3, 6]
 */
export function buildSeedOrder(bracketSize: number): number[] {
  if (!isPowerOfTwo(bracketSize)) return [];

  let order = [1];
  for (let size = 2; size <= bracketSize; size *= 2) {
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed);
      next.push(size + 1 - seed);
    }
    order = next;
  }
  return order;
}

export function buildSeedPositionMap(bracketSize: number): Map<number, number> {
  const order = buildSeedOrder(bracketSize);
  const map = new Map<number, number>();
  order.forEach((seed, idx) => {
    map.set(seed, idx);
  });
  return map;
}

/**
 * Returns R1 seed pairs in FACEIT documented order, derived from seed placement.
 * Example for 8: [[1,8],[4,5],[2,7],[3,6]]
 */
export function buildRound1SeedPairs(
  bracketSize: number
): Array<[number, number]> {
  const order = buildSeedOrder(bracketSize);
  if (order.length !== bracketSize) return [];
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < order.length; i += 2) {
    const a = order[i];
    const b = order[i + 1];
    if (a == null || b == null) return [];
    pairs.push([a, b]);
  }
  return pairs;
}

function log2Int(n: number): number {
  return Math.log2(n);
}

function lowestSetBit(n: number): number {
  return n & -n;
}

/**
 * Computes the canonical upper-bracket slot for a match in a given round using
 * leaf positions derived from FACEIT seed placement.
 *
 * Works for all rounds of the upper bracket.
 */
export function getUpperBracketSlotForSeeds(params: {
  bracketSize: number;
  round: number;
  seed1: number | undefined;
  seed2: number | undefined;
  seedPos: Map<number, number>;
}): number | null {
  const { bracketSize, round, seed1, seed2, seedPos } = params;
  if (!isPowerOfTwo(bracketSize) || round <= 0) return null;

  const s1 = seed1 ?? null;
  const s2 = seed2 ?? (s1 != null ? bracketSize + 1 - s1 : null); // BYE implies mirrored opponent
  if (s1 == null || s2 == null) return null;

  const p1 = seedPos.get(s1);
  const p2 = seedPos.get(s2);
  if (p1 == null || p2 == null) return null;

  const i = Math.min(p1, p2);
  const j = Math.max(p1, p2);
  const xor = i ^ j;
  if (xor === 0) return null;

  const k = lowestSetBit(xor); // 1 => R1, 2 => R2, 4 => R3 ...
  const computedRound = log2Int(k) + 1;
  if (!Number.isFinite(computedRound)) return null;

  // Canonical slot is derived from leaf intervals for the given round.
  const subtreeSize = Math.pow(2, round);
  const slot = Math.floor(i / subtreeSize);
  return Number.isFinite(slot) ? slot : null;
}

export function getUpperRoundCount(bracketSize: number): number {
  if (!isPowerOfTwo(bracketSize)) return 0;
  return Math.log2(bracketSize);
}

export function getUpperSlotsInRound(
  bracketSize: number,
  round: number
): number {
  const rounds = getUpperRoundCount(bracketSize);
  if (round <= 0 || round > rounds) return 0;
  return bracketSize / Math.pow(2, round);
}

export function getLowerRoundCount(bracketSize: number): number {
  const n = getUpperRoundCount(bracketSize);
  if (n <= 1) return 0;
  return 2 * (n - 1);
}

export function getLowerSlotsInRound(
  bracketSize: number,
  round: number
): number {
  const n = getUpperRoundCount(bracketSize);
  const lowerRounds = getLowerRoundCount(bracketSize);
  if (round <= 0 || round > lowerRounds) return 0;
  const exponent = n - 1 - Math.ceil(round / 2);
  return exponent >= 0 ? Math.pow(2, exponent) : 0;
}
