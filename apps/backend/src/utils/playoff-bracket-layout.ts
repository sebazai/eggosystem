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
 * **Round 2 onward (even rounds):** losers drop from upper bracket round `lowerRound/2 + 1`.
 * The first drop round (lower round 2) uses **reversed** pairing vs upper index so that column
 * `k` (winner from lower R1 column `k`) faces the loser of upper round 2 match `ubSlots-1-k`.
 * Later drop rounds (4, 6, …) keep the **same** upper index as the display slot.
 *
 * **Odd rounds ≥ 3:** winners of the previous lower round merge in adjacent pairs
 * `(0,1), (2,3), …` → display slot `floor(min(prevSlotA, prevSlotB) / 2)`.
 *
 * @see getLowerBracketR1LayoutSlot — implements the round-1 column index rule only.
 * @see getLowerBracketR1LayoutSlotOrGuess — same column when one side is still a FaceIT placeholder (no seed2).
 * @see getLowerBracketEvenDropRoundLayoutSlotFromState — even lower rounds (drops from upper).
 * @see getLowerBracketMergeRoundLayoutSlot — odd merge rounds from previous-round participant slots.
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

/**
 * Upper-bracket match index (0-based) at `upperRound` for a team that reached that round,
 * derived from their upper round-1 leaf slot.
 */
export function getUpperBracketMatchIndexAtRound(params: {
  bracketSize: number;
  upperRound: number;
  seed: number;
}): number | null {
  const { bracketSize, upperRound, seed } = params;
  if (!isPowerOfTwo(bracketSize) || upperRound < 1) return null;
  const n = getUpperRoundCount(bracketSize);
  if (upperRound > n) return null;
  const r1 = getUpperBracketR1SlotForSeed(seed, bracketSize);
  if (r1 == null) return null;
  return Math.floor(r1 / Math.pow(2, upperRound - 1));
}

/**
 * Even lower rounds (2, 4, 6, …): one side drops from upper round `lowerRound/2 + 1`.
 * Uses previous-round participant slots to tell the upper drop from the lower-path team when
 * both seeds would map to the same upper index (e.g. both were in upper round 3).
 */
export function getLowerBracketEvenDropRoundLayoutSlotFromState(params: {
  bracketSize: number;
  lowerRound: number;
  seed1: number | undefined;
  seed2: number | undefined;
  team1Id: number;
  team2Id: number | null;
  prevRoundParticipantSlotByTeamId: Map<number, number>;
}): number | null {
  const {
    bracketSize,
    lowerRound,
    seed1,
    seed2,
    team1Id,
    team2Id,
    prevRoundParticipantSlotByTeamId
  } = params;
  if (!isPowerOfTwo(bracketSize) || lowerRound < 2 || lowerRound % 2 !== 0) {
    return null;
  }
  const wave = lowerRound / 2;
  const upperRound = wave + 1;
  const n = getUpperRoundCount(bracketSize);
  if (upperRound > n) return null;

  const ubSlots = getUpperSlotsInRound(bracketSize, upperRound);
  if (ubSlots <= 0) return null;

  const slotFromUpperIndex = (u: number): number =>
    wave === 1 ? ubSlots - 1 - u : u;

  const prevSlot = (teamId: number): number | undefined =>
    teamId > 0
      ? prevRoundParticipantSlotByTeamId.get(teamId)
      : undefined;

  if (
    seed1 != null &&
    seed2 != null &&
    team1Id > 0 &&
    team2Id != null &&
    team2Id > 0
  ) {
    const p1 = prevSlot(team1Id);
    const p2 = prevSlot(team2Id);
    const t1InPrev = p1 !== undefined;
    const t2InPrev = p2 !== undefined;
    // Feeder played the previous lower round and has a slot; upper dropper did not.
    if (t1InPrev === t2InPrev) {
      return null;
    }
    const dropSeed = t1InPrev ? seed2 : seed1;
    const feederPrev = t1InPrev ? p1! : p2!;
    const u = getUpperBracketMatchIndexAtRound({
      bracketSize,
      upperRound,
      seed: dropSeed
    });
    if (u == null) return null;
    const slot = slotFromUpperIndex(u);
    return feederPrev === slot ? slot : null;
  }

  const onlySeed = seed1 ?? seed2;
  const onlyTeam =
    onlySeed != null && seed1 != null && onlySeed === seed1
      ? team1Id
      : team2Id ?? 0;
  if (onlySeed == null || onlyTeam <= 0) return null;
  // Only the upper dropper can be placed from seed alone (no LB prev slot).
  if (prevSlot(onlyTeam) !== undefined) {
    return null;
  }
  const u = getUpperBracketMatchIndexAtRound({
    bracketSize,
    upperRound,
    seed: onlySeed
  });
  if (u == null) return null;
  return slotFromUpperIndex(u);
}

/**
 * Odd lower rounds ≥ 3: merge winners from adjacent slots of the previous lower round.
 */
export function getLowerBracketMergeRoundLayoutSlot(params: {
  team1Id: number;
  team2Id: number | null;
  prevRoundParticipantSlotByTeamId: Map<number, number>;
}): number | null {
  const { team1Id, team2Id, prevRoundParticipantSlotByTeamId } = params;
  if (team2Id == null || team2Id <= 0 || team1Id <= 0) return null;
  const s1 = prevRoundParticipantSlotByTeamId.get(team1Id);
  const s2 = prevRoundParticipantSlotByTeamId.get(team2Id);
  if (s1 === undefined || s2 === undefined) return null;
  if (Math.abs(s1 - s2) !== 1) return null;
  return Math.floor(Math.min(s1, s2) / 2);
}
