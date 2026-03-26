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
  getLowerBracketR1LayoutSlotOrGuess,
  getLowerRoundCount,
  getLowerSlotsInRound,
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

      let team1Id = teamIdMap.get(f1.faction_id) ?? 0;
      let team2Id: number | null = bye2
        ? null
        : (teamIdMap.get(f2.faction_id) ?? 0);
      let seed1 = team1Id ? playoffSeedMap.get(team1Id) : undefined;
      let seed2 = team2Id != null ? playoffSeedMap.get(team2Id) : undefined;

      // Higher seed (lower number) is always home (team1). Swap if needed.
      if (!bye2 && seed1 != null && seed2 != null && seed1 > seed2) {
        [team1Id, team2Id] = [team2Id ?? 0, team1Id];
        [seed1, seed2] = [seed2, seed1];
      }

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

      // After possible swap: team1 is the side we have first (f1 or f2), team2 second. Use our DB team logo, not FaceIT.
      const team1FromF1 = team1Id === (teamIdMap.get(f1.faction_id) ?? 0);
      const team1Name = team1FromF1
        ? f1.name || "TBD"
        : bye2
          ? BYE_NAME
          : f2.name || "TBD";
      const team2Name = team1FromF1
        ? bye2
          ? BYE_NAME
          : f2.name || "TBD"
        : f1.name || "TBD";
      const team1Logo = team1Id > 0 ? (teamLogoMap.get(team1Id) ?? null) : null;
      const team2Logo =
        bye2 || team2Id == null || team2Id <= 0
          ? null
          : (teamLogoMap.get(team2Id) ?? null);
      const team1Score = team1FromF1 ? (bye2 ? 1 : score1) : bye2 ? 0 : score2;
      const team2Score = team1FromF1 ? (bye2 ? 0 : score2) : bye2 ? 1 : score1;

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
      return (a.external_match_id ?? "").localeCompare(
        b.external_match_id ?? ""
      );
    });

    // Ensure stable slot ordering for non-upper groups and any un-slotted matches.
    // Upper group already has canonical slot from seed placement.
    // Lower group first round: sort by inferred column; assign m.slot to that column index (not
    // sequential 0..n-1) so putMatchRef places each match in the correct layout cell vs FaceIT.
    // Lower group round >= 2: still sorted by min seed leaf (heuristic); true order follows
    // which upper match drops vs which LB match feeds in (see playoff-bracket-layout.ts JSDoc).
    const byGroupRound = new Map<string, PlayoffBracketMatch[]>();
    for (const m of matches) {
      const key = `${m.group}-${m.round}`;
      const arr = byGroupRound.get(key) ?? [];
      arr.push(m);
      byGroupRound.set(key, arr);
    }

    const lowerBracketRounds = matches
      .filter((m) => m.group === 2)
      .map((m) => m.round);
    const firstLowerBracketRound =
      lowerBracketRounds.length > 0 ? Math.min(...lowerBracketRounds) : 1;

    for (const [key, arr] of byGroupRound) {
      const [groupStr, roundStr] = key.split("-");
      const group = Number(groupStr);
      const round = Number(roundStr);
      if (group === 1) continue;

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

      const lowerR1OrderSlot = (m: PlayoffBracketMatch): number | null =>
        bracketSize > 0
          ? getLowerBracketR1LayoutSlotOrGuess({
              seed1: m.seed1,
              seed2: m.seed2,
              bracketSize
            })
          : null;

      arr.sort((a, b) => {
        if (
          group === 2 &&
          round === firstLowerBracketRound &&
          bracketSize > 0
        ) {
          const sa = lowerR1OrderSlot(a);
          const sb = lowerR1OrderSlot(b);
          if (sa != null && sb != null && sa !== sb) return sa - sb;
          if (sa != null && sb == null) return -1;
          if (sa == null && sb != null) return 1;
          if (sa != null && sb != null && sa === sb) {
            return (a.external_match_id ?? "").localeCompare(
              b.external_match_id ?? ""
            );
          }
        }

        const ka = scoreKey(a);
        const kb = scoreKey(b);
        if (ka !== kb) return ka - kb;
        const minA = getMatchMinSeed(a);
        const minB = getMatchMinSeed(b);
        if (minA !== minB) return minA - minB;
        return (a.external_match_id ?? "").localeCompare(
          b.external_match_id ?? ""
        );
      });

      if (group === 2 && round === firstLowerBracketRound && bracketSize > 0) {
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
      } else {
        arr.forEach((m, i) => {
          m.slot = i;
        });
      }
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
      const round = m.group === 3 ? 1 : m.round;
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
