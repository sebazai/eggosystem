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

/**
 * Upper bracket round-1 match index (0-based) where this seed plays in the first round.
 */
export function getUpperBracketR1SlotForSeed(
  seed: number | undefined,
  bracketSize: number
): number | null {
  if (
    seed == null ||
    !Number.isInteger(seed) ||
    seed < 1 ||
    seed > bracketSize
  ) {
    return null;
  }
  const pairs = buildRound1SeedPairs(bracketSize);
  for (let i = 0; i < pairs.length; i++) {
    const [a, b] = pairs[i];
    if (a === seed || b === seed) return i;
  }
  return null;
}

/**
 * Double-elim **lower bracket** (group 2), FACEIT-style:
 *
 * **Round 1 — fixed columns (example: 16 teams, 8 UB R1 matches):** layout slot `k`
 * (0-based) is always losers of **upper bracket round 1** matches at indices `2k` and `2k+1`.
 * In 1-based wording: column 1 = UB match 1 loser vs UB match 2 loser, column 2 = UB3 vs UB4
 * loser, etc. Same pairing rule for any power-of-two bracket size.
 *
 * **Round 2 onward:** each match is conceptually **upper feed** (loser dropping from a specific
 * upper-bracket match / round) vs **lower feed** (winner of a specific lower-bracket match from
 * the previous lower round). FaceIT UI often shows the upper path on one side and the LB chain
 * on the other; exact column order for those rounds is not derived here yet — the playoff
 * controller still orders group 2, round ≥ 2 by seed leaf positions as a heuristic until we have
 * an explicit feeder→slot map (or API fields).
 *
 * @see getLowerBracketR1LayoutSlot — implements the round-1 column index rule only.
 * @see getLowerBracketR1LayoutSlotOrGuess — same column when one side is still a FaceIT placeholder (no seed2).
 */
export function getLowerBracketR1LayoutSlot(params: {
  seed1: number | undefined;
  seed2: number | undefined;
  bracketSize: number;
}): number | null {
  const { seed1, seed2, bracketSize } = params;
  const u1 = getUpperBracketR1SlotForSeed(seed1, bracketSize);
  const u2 = getUpperBracketR1SlotForSeed(seed2, bracketSize);
  if (u1 == null || u2 == null) return null;
  const lo = Math.min(u1, u2);
  const hi = Math.max(u1, u2);
  if (hi !== lo + 1) return null;
  return Math.floor(lo / 2);
}

/**
 * Lower bracket R1 layout column (0-based). Uses {@link getLowerBracketR1LayoutSlot} when both
 * teams have seeds from adjacent UB R1 matches; otherwise infers the column from any single seed:
 * a team that lost UB R1 slot `u` belongs in LB R1 column `floor(u / 2)`.
 */
export function getLowerBracketR1LayoutSlotOrGuess(params: {
  seed1: number | undefined;
  seed2: number | undefined;
  bracketSize: number;
}): number | null {
  const full = getLowerBracketR1LayoutSlot(params);
  if (full != null) return full;
  const u1 = getUpperBracketR1SlotForSeed(params.seed1, params.bracketSize);
  const u2 = getUpperBracketR1SlotForSeed(params.seed2, params.bracketSize);
  const has1 = u1 != null;
  const has2 = u2 != null;
  if (has1 && !has2) return Math.floor(u1! / 2);
  if (!has1 && has2) return Math.floor(u2! / 2);
  if (has1 && has2) {
    const k1 = Math.floor(u1! / 2);
    const k2 = Math.floor(u2! / 2);
    if (k1 === k2) return k1;
    return null;
  }
  return null;
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
