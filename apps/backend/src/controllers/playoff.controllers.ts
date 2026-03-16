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

const BYE_NAME = "BYE";

const isByeFaction = (name: string, factionId: string): boolean =>
  name === BYE_NAME || !factionId || factionId.trim() === "";

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

/**
 * Round-1 slot count from max seed. Scales for any bracket size.
 * 8 teams → 4 slots; 12 teams → 8 slots; 16 teams → 8 slots; 32 teams → 16 slots.
 */
const getRound1SlotCount = (maxSeed: number): number => {
  if (maxSeed <= 0) return 0;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(maxSeed)));
  return bracketSize / 2;
};

/**
 * Slot from seeds: box order is by minimum seed (1, 2, 3, 4...).
 * R1: slot = minSeed - 1 clamped to [0, numSlots-1]. R2+: use minSeed as sort key only.
 */
const getMinSeed = (
  seed1: number | undefined,
  seed2: number | undefined
): number => {
  if (seed1 != null && seed2 != null) return Math.min(seed1, seed2);
  if (seed1 != null) return seed1;
  if (seed2 != null) return seed2;
  return 999;
};

const getRound1Slot = (
  seed1: number | undefined,
  seed2: number | undefined,
  numSlots: number
): number => {
  const minSeed = getMinSeed(seed1, seed2);
  if (minSeed === 999 || numSlots <= 0) return 999;
  return Math.min(Math.max(0, minSeed - 1), numSlots - 1);
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
    const numSlots = getRound1SlotCount(maxSeed);

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
      const isRound1 = item.round === 1;
      const slot =
        isRound1 && numSlots > 0
          ? getRound1Slot(seed1, seed2, numSlots)
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
        bye2 || team2Id == null ? null : (teamLogoMap.get(team2Id) ?? null);
      const team1Score = team1FromF1 ? (bye2 ? 1 : score1) : bye2 ? 0 : score2;
      const team2Score = team1FromF1 ? (bye2 ? 0 : score2) : bye2 ? 1 : score1;

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
        team2_id: bye2 ? null : team2Id,
        team2_name: bye2 ? null : team2Name,
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

    // Assign stable slot for all rounds (0, 1, 2, ...) within each (group, round)
    const byGroupRound = new Map<string, PlayoffBracketMatch[]>();
    for (const m of matches) {
      const key = `${m.group}-${m.round}`;
      const arr = byGroupRound.get(key) ?? [];
      arr.push(m);
      byGroupRound.set(key, arr);
    }
    for (const arr of byGroupRound.values()) {
      arr.forEach((m, i) => {
        m.slot = i;
      });
    }

    const response: PlayoffBracketResponse = {
      matches,
      bracket: { numR1Slots: numSlots }
    };
    res.json(response);
  } catch (error) {
    return next(error);
  }
};
