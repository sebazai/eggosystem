import { type Request, type Response, type NextFunction } from "express";
import type {
  PlayoffBracketMatch,
  PlayoffBracketResponse
} from "@eggosystem/types";
import type { Match } from "@eggosystem/types";
import { getPlayoffExternalIdBySeasonAndLeague } from "../models/season-league-external-id.models";
import { getChampionshipMatchesCached } from "../services/playoff-bracket.services";
import { getPlayoffMatchIdsByExternalRoomIds } from "../models/match.models";
import {
  getTeamIdsByExternalIds,
  getPlayoffSeedMapBySeasonAndLeague
} from "../models/season-league-team.models";
import { getTeamLogosByTeamIds } from "../models/team.models";
import {
  buildSeedPositionMap,
  getBracketSizeFromMaxSeed,
  getLowerBracketEvenDropRoundLayoutSlotFromState,
  getLowerBracketMergeRoundLayoutSlot,
  getLowerBracketR1LayoutSlotOrGuess,
  getLowerRoundCount,
  shouldSwapLowerDropRoundHomeAway,
  getLowerSlotsInRound,
  getUpperBracketR1SlotForSeed,
  getUpperBracketSlotForSeeds,
  getUpperRoundCount,
  getUpperSlotsInRound
} from "../utils/playoff-bracket-layout";

const BYE_NAME = "BYE";

const isByeFaction = (name: string, factionId: string): boolean =>
  name.trim().toUpperCase() === BYE_NAME ||
  !factionId ||
  factionId.trim() === "";

const ALLOWED_MATCH_STATUSES = new Set<string>([
  "SCHEDULED",
  "CHECK_IN",
  "VOTING",
  "CONFIGURING",
  "READY",
  "ONGOING",
  "FINISHED",
  "ABORTED",
  "CANCELLED",
  "FORFEIT"
]);

const isMatchStatus = (s: string): s is Match["status"] =>
  ALLOWED_MATCH_STATUSES.has(s);

const faceitStatusToMatchStatus = (status: string): Match["status"] =>
  isMatchStatus(status) ? status : "SCHEDULED";

const scheduledAtToIso = (scheduledAt: number | null | undefined): string => {
  const ms =
    scheduledAt != null && Number.isFinite(scheduledAt)
      ? scheduledAt * 1000
      : 0;
  const date = new Date(ms);
  return Number.isNaN(date.getTime())
    ? new Date(0).toISOString()
    : date.toISOString();
};

/** Swap home/away on a bracket match (scores and seeds stay with the team). */
function swapPlayoffBracketMatchSides(m: PlayoffBracketMatch): void {
  const t1 = m.team1_id;
  const t2 = m.team2_id;
  m.team1_id = t2 ?? 0;
  m.team2_id = t1;
  const n1 = m.team1_name;
  m.team1_name = m.team2_name ?? "TBD";
  m.team2_name = n1;
  const l1 = m.team1_logo;
  m.team1_logo = m.team2_logo;
  m.team2_logo = l1;
  const s1 = m.team1_score;
  m.team1_score = m.team2_score ?? 0;
  m.team2_score = s1;
  const sd1 = m.seed1;
  m.seed1 = m.seed2;
  m.seed2 = sd1;
}

const getMinSeed = (
  seed1: number | undefined,
  seed2: number | undefined
): number => {
  if (seed1 != null && seed2 != null) return Math.min(seed1, seed2);
  if (seed1 != null) return seed1;
  if (seed2 != null) return seed2;
  return 999;
};

export const getPlayoffBracketController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { season_id, league_id } = req.params;
    const seasonId = Number(season_id);
    const leagueId = Number(league_id);

    const championshipId = await getPlayoffExternalIdBySeasonAndLeague(
      seasonId,
      leagueId
    );
    if (!championshipId) {
      res.json({
        matches: [],
        bracket: { numR1Slots: 0 }
      } satisfies PlayoffBracketResponse);
      return;
    }

    const items = await getChampionshipMatchesCached(championshipId);

    const apiIndexMap = new Map<string, number>();
    items.forEach((item, idx) => apiIndexMap.set(item.match_id, idx));

    const externalMatchIds = items.map((i) => i.match_id);
    const matchIdMap = await getPlayoffMatchIdsByExternalRoomIds(
      seasonId,
      leagueId,
      externalMatchIds
    );

    const factionIds = new Set<string>();
    for (const item of items) {
      const f1 = item.teams.faction1;
      const f2 = item.teams.faction2;
      if (!isByeFaction(f1.name, f1.faction_id)) factionIds.add(f1.faction_id);
      if (!isByeFaction(f2.name, f2.faction_id)) factionIds.add(f2.faction_id);
    }
    const teamIdMap = await getTeamIdsByExternalIds(seasonId, [...factionIds]);
    const teamIdsForLogos = [...teamIdMap.values()].filter((id) => id > 0);
    const teamLogoMap = await getTeamLogosByTeamIds(teamIdsForLogos);
    const playoffSeedMap = await getPlayoffSeedMapBySeasonAndLeague(
      seasonId,
      leagueId
    );
    const maxSeed =
      playoffSeedMap.size > 0 ? Math.max(...playoffSeedMap.values()) : 0;
    const bracketSize = getBracketSizeFromMaxSeed(maxSeed);
    const numSlots = bracketSize > 0 ? bracketSize / 2 : 0;
    const seedPos = bracketSize > 0 ? buildSeedPositionMap(bracketSize) : null;

    const group2Rounds = items.filter((i) => i.group === 2).map((i) => i.round);
    const firstLowerRoundInPayload =
      group2Rounds.length > 0 ? Math.min(...group2Rounds) : null;
    /** FaceIT may use lower rounds 2..n+1 instead of 1..n; all DE logic uses offset from this. */
    const firstLowerFaceitRound = firstLowerRoundInPayload ?? 1;
    const lowerFaceitOffset0 = (faceitRound: number) =>
      faceitRound - firstLowerFaceitRound;
    /** Canonical LB1=1, LB2 (first drop)=2, LB3 (merge)=3, … (matches playoff-bracket-layout). */
    const toCanonicalLowerRound = (faceitRound: number) =>
      lowerFaceitOffset0(faceitRound) + 1;
    /** LB3, LB5, … (two LB-only winners merge). */
    const isLowerFaceitMergeRound = (faceitRound: number) => {
      const off = lowerFaceitOffset0(faceitRound);
      return off >= 2 && off % 2 === 0;
    };
    /** LB2, LB4, … (drop from upper + LB feeder). */
    const isLowerFaceitDropRoundAfterFirst = (faceitRound: number) => {
      const off = lowerFaceitOffset0(faceitRound);
      return off >= 1 && off % 2 === 1;
    };

    const seeds: Array<{
      seed: number;
      team_id: number;
      team_name: string;
      team_logo: string | null;
    } | null> =
      bracketSize > 0
        ? Array.from({ length: bracketSize + 1 }, () => null) // 1-based seeds; index 0 unused
        : [];

    const matches: PlayoffBracketMatch[] = items.map((item) => {
      let f1 = item.teams.faction1;
      let f2 = item.teams.faction2;
      let score1 = item.results?.score?.faction1 ?? 0;
      let score2 = item.results?.score?.faction2 ?? 0;
      // Normalize so BYE is always faction2 (real team is team1)
      if (
        isByeFaction(f1.name, f1.faction_id) &&
        !isByeFaction(f2.name, f2.faction_id)
      ) {
        [f1, f2] = [f2, f1];
        [score1, score2] = [score2, score1];
      }
      const bye2 = isByeFaction(f2.name, f2.faction_id);

      type BracketSide = {
        faction_id: string;
        name: string;
        score: number;
        team_id: number;
        seed: number | undefined;
      };

      const sideFromFaction = (
        name: string,
        faction_id: string,
        score: number
      ): BracketSide => {
        const team_id = teamIdMap.get(faction_id) ?? 0;
        const seed = team_id > 0 ? playoffSeedMap.get(team_id) : undefined;
        return {
          faction_id,
          name: name || "TBD",
          score,
          team_id,
          seed
        };
      };

      let home = sideFromFaction(f1.name, f1.faction_id, score1);
      let away = sideFromFaction(f2.name, f2.faction_id, score2);

      const isLowerBracketRound1 =
        item.group === 2 && lowerFaceitOffset0(item.round) === 0;

      const isLowerMergeRound =
        item.group === 2 && isLowerFaceitMergeRound(item.round);

      const isLowerDropRoundAfterFirst =
        item.group === 2 && isLowerFaceitDropRoundAfterFirst(item.round);

      if (!bye2) {
        const swapHomeAway = (): boolean => {
          // Lower R1 pairs losers of adjacent UB R1 matches (2k vs 2k+1). Top slot = loser from
          // the **earlier** UB R1 match (lower 0-based index), bottom = later match — same as
          // upper-bracket box order, not better playoff seed first.
          if (isLowerBracketRound1 && bracketSize > 0) {
            const r1Home =
              home.seed != null
                ? getUpperBracketR1SlotForSeed(home.seed, bracketSize)
                : null;
            const r1Away =
              away.seed != null
                ? getUpperBracketR1SlotForSeed(away.seed, bracketSize)
                : null;
            if (r1Home != null && r1Away != null) {
              return r1Home > r1Away;
            }
            return false;
          }
          // Odd lower rounds > R1 merge two LB paths; home/away follows previous-round slot order
          // after layout (see post-pass below).
          if (isLowerMergeRound) {
            return false;
          }
          // Even LB drop rounds: upper dropper on top — corrected after slotting (prev-round map).
          if (isLowerDropRoundAfterFirst) {
            return false;
          }
          if (home.seed != null && away.seed != null) {
            return home.seed > away.seed;
          }
          return false;
        };
        if (swapHomeAway()) {
          [home, away] = [away, home];
        }
      }

      const team1Id = home.team_id;
      const team2Id: number | null = bye2 ? null : away.team_id;
      const seed1 = home.seed;
      const seed2 = away.seed;

      const internalMatchId = matchIdMap.get(item.match_id) ?? 0;
      const slot =
        seedPos && item.group === 1
          ? (getUpperBracketSlotForSeeds({
              bracketSize,
              round: item.round,
              seed1,
              seed2,
              seedPos
            }) ?? undefined)
          : undefined;

      const team1Name = home.name;
      const team2Name = bye2 ? BYE_NAME : away.name;
      const team1Logo = team1Id > 0 ? (teamLogoMap.get(team1Id) ?? null) : null;
      const team2Logo =
        bye2 || team2Id == null || team2Id <= 0
          ? null
          : (teamLogoMap.get(team2Id) ?? null);
      const team1Score = bye2 ? 1 : home.score;
      const team2Score = bye2 ? 0 : away.score;

      // Keep seeds lookup populated for other frontends: seed -> team metadata.
      // Prefer DB-derived team fields (stable), and avoid encoding BYE as a fake team.
      if (bracketSize > 0) {
        if (
          seed1 != null &&
          seed1 >= 1 &&
          seed1 <= bracketSize &&
          team1Id > 0
        ) {
          if (!seeds[seed1]) {
            seeds[seed1] = {
              seed: seed1,
              team_id: team1Id,
              team_name: team1Name,
              team_logo: team1Logo
            };
          }
        }
        if (
          seed2 != null &&
          seed2 >= 1 &&
          seed2 <= bracketSize &&
          team2Id != null &&
          team2Id > 0
        ) {
          if (!seeds[seed2]) {
            seeds[seed2] = {
              seed: seed2,
              team_id: team2Id,
              team_name: team2Name,
              team_logo: team2Logo
            };
          }
        }
      }

      return {
        match_id: internalMatchId,
        external_match_id: item.match_id,
        round: item.round,
        group: item.group,
        status: faceitStatusToMatchStatus(item.status),
        best_of: item.best_of,
        start_timestamp: scheduledAtToIso(item.scheduled_at),
        team1_id: team1Id,
        team1_name: team1Name,
        team1_logo: team1Logo,
        team2_id: bye2 || team2Id == null || team2Id <= 0 ? null : team2Id,
        team2_name: bye2 || team2Id == null || team2Id <= 0 ? null : team2Name,
        team2_logo: bye2 ? null : team2Logo,
        team1_score: team1Score,
        team2_score: bye2 ? 0 : team2Score,
        slot,
        seed1: seed1 ?? undefined,
        seed2: seed2 ?? undefined
      };
    });

    // Sort by group, round, then by min seed (low to high) so box order is seed-driven
    const getMatchMinSeed = (m: PlayoffBracketMatch): number =>
      getMinSeed(m.seed1, m.seed2);

    matches.sort((a, b) => {
      if (a.group !== b.group) return a.group - b.group;
      if (a.round !== b.round) return a.round - b.round;
      const slotA = a.slot ?? 999;
      const slotB = b.slot ?? 999;
      if (slotA !== slotB) return slotA - slotB;
      const minA = getMatchMinSeed(a);
      const minB = getMatchMinSeed(b);
      if (minA !== minB) return minA - minB;
      const aiA = apiIndexMap.get(a.external_match_id ?? "") ?? 99999;
      const aiB = apiIndexMap.get(b.external_match_id ?? "") ?? 99999;
      return aiA - aiB;
    });

    // Ensure stable slot ordering for non-upper groups and any un-slotted matches.
    // Upper group already has canonical slot from seed placement.
    // Lower group first round: sort by inferred column; assign m.slot to that column index (not
    // sequential 0..n-1) so putMatchRef places each match in the correct layout cell vs FaceIT.
    // Lower group round ≥ 2: canonical double-elim geometry (reversed UB drops in LB round 2,
    // same-index drops later, odd rounds merge adjacent previous slots) — see playoff-bracket-layout.ts.
    const byGroupRound = new Map<string, PlayoffBracketMatch[]>();
    for (const m of matches) {
      const key = `${m.group}-${m.round}`;
      const arr = byGroupRound.get(key) ?? [];
      arr.push(m);
      byGroupRound.set(key, arr);
    }

    const apiOrder = (
      a: PlayoffBracketMatch,
      b: PlayoffBracketMatch
    ): number => {
      const aiA = apiIndexMap.get(a.external_match_id ?? "") ?? 99999;
      const aiB = apiIndexMap.get(b.external_match_id ?? "") ?? 99999;
      return aiA - aiB;
    };

    const lowerR1OrderSlot = (m: PlayoffBracketMatch): number | null =>
      bracketSize > 0
        ? getLowerBracketR1LayoutSlotOrGuess({
            seed1: m.seed1,
            seed2: m.seed2,
            bracketSize
          })
        : null;

    /** After each lower round, both participants map to that match's slot (for merge/drop wiring). */
    const participantSlotByTeam = new Map<number, number>();
    /** Lower round number → team_id → display slot for that round (for merge home/away). */
    const lbSlotByTeamByRound = new Map<number, Map<number, number>>();

    const lowerKeysSorted = [...byGroupRound.keys()]
      .filter((k) => k.startsWith("2-"))
      .sort((a, b) => Number(a.split("-")[1]!) - Number(b.split("-")[1]!));

    for (const key of lowerKeysSorted) {
      const arr = byGroupRound.get(key)!;
      const round = Number(key.split("-")[1]!);

      if (lowerFaceitOffset0(round) === 0 && bracketSize > 0) {
        arr.sort((a, b) => {
          const sa = lowerR1OrderSlot(a);
          const sb = lowerR1OrderSlot(b);
          if (sa != null && sb != null && sa !== sb) return sa - sb;
          if (sa != null && sb == null) return -1;
          if (sa == null && sb != null) return 1;
          return apiOrder(a, b);
        });
        const usedSlots = new Set<number>();
        for (const m of arr) {
          const preferred = getLowerBracketR1LayoutSlotOrGuess({
            seed1: m.seed1,
            seed2: m.seed2,
            bracketSize
          });
          let slot: number;
          if (preferred != null && !usedSlots.has(preferred)) {
            slot = preferred;
          } else {
            let t = 0;
            while (usedSlots.has(t)) t++;
            slot = t;
          }
          usedSlots.add(slot);
          m.slot = slot;
        }
      } else if (bracketSize > 0 && isLowerFaceitDropRoundAfterFirst(round)) {
        const preferEven = (m: PlayoffBracketMatch): number | null =>
          getLowerBracketEvenDropRoundLayoutSlotFromState({
            bracketSize,
            lowerRound: toCanonicalLowerRound(round),
            seed1: m.seed1,
            seed2: m.seed2,
            team1Id: m.team1_id,
            team2Id: m.team2_id,
            prevRoundParticipantSlotByTeamId: participantSlotByTeam
          });
        arr.sort((a, b) => {
          const pa = preferEven(a);
          const pb = preferEven(b);
          if (pa != null && pb != null && pa !== pb) return pa - pb;
          if (pa != null && pb == null) return -1;
          if (pa == null && pb != null) return 1;
          return apiOrder(a, b);
        });
        const used = new Set<number>();
        for (const m of arr) {
          let slot = preferEven(m);
          if (slot == null || used.has(slot)) {
            slot = 0;
            while (used.has(slot)) slot++;
          }
          used.add(slot);
          m.slot = slot;
        }
      } else if (bracketSize > 0 && isLowerFaceitMergeRound(round)) {
        const preferMerge = (m: PlayoffBracketMatch): number | null =>
          getLowerBracketMergeRoundLayoutSlot({
            team1Id: m.team1_id,
            team2Id: m.team2_id,
            prevRoundParticipantSlotByTeamId: participantSlotByTeam
          });
        arr.sort((a, b) => {
          const pa = preferMerge(a);
          const pb = preferMerge(b);
          if (pa != null && pb != null && pa !== pb) return pa - pb;
          if (pa != null && pb == null) return -1;
          if (pa == null && pb != null) return 1;
          return apiOrder(a, b);
        });
        const used = new Set<number>();
        for (const m of arr) {
          let slot = preferMerge(m);
          if (slot == null || used.has(slot)) {
            slot = 0;
            while (used.has(slot)) slot++;
          }
          used.add(slot);
          m.slot = slot;
        }
      } else {
        arr.sort((a, b) => apiOrder(a, b));
        arr.forEach((m, i) => {
          m.slot = i;
        });
      }

      const roundSnapshot = new Map<number, number>();
      for (const m of arr) {
        const sl = m.slot ?? 0;
        if (m.team1_id > 0) roundSnapshot.set(m.team1_id, sl);
        if (m.team2_id != null && m.team2_id > 0) {
          roundSnapshot.set(m.team2_id, sl);
        }
      }
      lbSlotByTeamByRound.set(round, roundSnapshot);

      for (const m of arr) {
        const sl = m.slot ?? 0;
        if (m.team1_id > 0) participantSlotByTeam.set(m.team1_id, sl);
        if (m.team2_id != null && m.team2_id > 0) {
          participantSlotByTeam.set(m.team2_id, sl);
        }
      }
    }

    // LB3, LB5, … merge winners from adjacent previous-round slots: team1 = feeder from the
    // lower slot index (same convention as LB R1 vs upper). Uses FaceIT round offset, not parity.
    for (const key of lowerKeysSorted) {
      const round = Number(key.split("-")[1]!);
      if (bracketSize <= 0 || !isLowerFaceitMergeRound(round)) {
        continue;
      }
      const prevMap = lbSlotByTeamByRound.get(round - 1);
      if (!prevMap) continue;
      const arr = byGroupRound.get(key)!;
      for (const m of arr) {
        if (m.team1_id <= 0 || m.team2_id == null || m.team2_id <= 0) continue;
        const s1 = prevMap.get(m.team1_id);
        const s2 = prevMap.get(m.team2_id);
        if (s1 === undefined || s2 === undefined) continue;
        if (s1 > s2) {
          swapPlayoffBracketMatchSides(m);
        }
      }
    }

    // LB2, LB4, … (first time in lower vs LB feeder): FaceIT shows upper dropper on top regardless
    // of seed — seed-only ordering would swap e.g. #8 vs #3 incorrectly (see playoff-bracket tests).
    for (const key of lowerKeysSorted) {
      const round = Number(key.split("-")[1]!);
      if (bracketSize <= 0 || !isLowerFaceitDropRoundAfterFirst(round)) {
        continue;
      }
      const prevMap = lbSlotByTeamByRound.get(round - 1);
      if (!prevMap) continue;
      const prevLbTeamIds = new Set(prevMap.keys());
      const arr = byGroupRound.get(key)!;
      for (const m of arr) {
        if (
          shouldSwapLowerDropRoundHomeAway({
            team1Id: m.team1_id,
            team2Id: m.team2_id,
            prevRoundLbTeamIds: prevLbTeamIds
          })
        ) {
          swapPlayoffBracketMatchSides(m);
        }
      }
    }

    for (const [key, arr] of byGroupRound) {
      const group = Number(key.split("-")[0]!);
      if (group === 1) continue;
      if (group === 2) continue;

      const scoreKey = (m: PlayoffBracketMatch): number => {
        if (!seedPos) return 999;
        const s1 = m.seed1 ?? null;
        const s2 =
          m.seed2 ??
          (group !== 2 && s1 != null && bracketSize > 0
            ? bracketSize + 1 - s1
            : null);
        const p1 = s1 != null ? seedPos.get(s1) : undefined;
        const p2 = s2 != null ? seedPos.get(s2) : undefined;
        const min = Math.min(p1 ?? 999, p2 ?? 999);
        return Number.isFinite(min) ? min : 999;
      };

      arr.sort((a, b) => {
        const ka = scoreKey(a);
        const kb = scoreKey(b);
        if (ka !== kb) return ka - kb;
        const minA = getMatchMinSeed(a);
        const minB = getMatchMinSeed(b);
        if (minA !== minB) return minA - minB;
        return apiOrder(a, b);
      });

      arr.forEach((m, i) => {
        m.slot = i;
      });
    }

    // Build layout-first response: groups -> rounds -> slots[] with match references.
    const layoutGroups: NonNullable<
      PlayoffBracketResponse["bracket"]["layout"]
    >["groups"] = [];

    const putMatchRef = (
      group: number,
      round: number,
      slotIndex: number,
      m: PlayoffBracketMatch
    ): void => {
      const g = layoutGroups.find((x) => x.group === group);
      if (!g) return;
      const r = g.rounds.find((x) => x.round === round);
      if (!r) return;
      if (slotIndex < 0 || slotIndex >= r.slots.length) return;
      if (r.slots[slotIndex] != null) return;
      r.slots[slotIndex] = {
        match_id: m.match_id,
        external_match_id: m.external_match_id
      };
    };

    if (bracketSize > 0) {
      const upperRounds = getUpperRoundCount(bracketSize);
      if (upperRounds > 0) {
        layoutGroups.push({
          group: 1,
          rounds: Array.from({ length: upperRounds }, (_, idx) => {
            const round = idx + 1;
            const slotsInRound = getUpperSlotsInRound(bracketSize, round);
            return {
              round,
              slots: Array.from({ length: slotsInRound }, () => null)
            };
          })
        });
      }

      const lowerRounds = getLowerRoundCount(bracketSize);
      const hasLower = matches.some((m) => m.group === 2);
      if (hasLower && lowerRounds > 0) {
        layoutGroups.push({
          group: 2,
          rounds: Array.from({ length: lowerRounds }, (_, idx) => {
            const round = idx + 1;
            const slotsInRound = getLowerSlotsInRound(bracketSize, round);
            return {
              round,
              slots: Array.from({ length: slotsInRound }, () => null)
            };
          })
        });
      }
    }

    const hasGrandFinal = matches.some((m) => m.group === 3);
    if (hasGrandFinal) {
      layoutGroups.push({
        group: 3,
        rounds: [{ round: 1, slots: [null] }]
      });
    }

    for (const m of matches) {
      const slotIndex = m.slot ?? null;
      if (slotIndex == null) continue;
      // Grand final might come with arbitrary round index from provider; normalize to round 1.
      // Lower bracket: map FaceIT round → canonical 1..lowerRounds so layout columns align.
      const round =
        m.group === 3
          ? 1
          : m.group === 2
            ? toCanonicalLowerRound(m.round)
            : m.round;
      putMatchRef(m.group, round, slotIndex, m);
    }

    const response: PlayoffBracketResponse = {
      matches,
      bracket: {
        bracketSize: bracketSize || undefined,
        numR1Slots: numSlots,
        seeds: seeds.length > 0 ? seeds : undefined,
        layout: layoutGroups.length > 0 ? { groups: layoutGroups } : undefined
      }
    };
    res.json(response);
  } catch (error) {
    return next(error);
  }
};
