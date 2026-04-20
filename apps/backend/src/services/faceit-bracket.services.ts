import { expireIn7Days, redisClient } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import type { FaceitChampionshipMatchItem } from "@eggosystem/types";

const CACHE_KEY_PREFIX = "faceit-championship-bracket-matches:";

const getCacheKey = (championshipId: string): string =>
  `${CACHE_KEY_PREFIX}${championshipId}`;

type FaceitBracketPayload = {
  rounds: Array<{
    number: number;
    matches: string[];
  }>;
  matches: Record<
    string,
    {
      id: string;
      status: string;
      schedule?: number;
      bestOf?: number;
      factions?: Array<{
        number: number;
        entity?: {
          id: string;
          name?: string;
          avatar?: string;
        };
        score?: number;
        winner?: boolean;
      }>;
    }
  >;
};

type FaceitBracketResponse = {
  payload?: FaceitBracketPayload;
};

const isRecord = (u: unknown): u is Record<string, unknown> =>
  typeof u === "object" && u !== null && !Array.isArray(u);

function normalizeStatus(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "finished") return "FINISHED";
  if (s === "ongoing") return "ONGOING";
  if (s === "created") return "SCHEDULED";
  if (s === "dummy") return "SCHEDULED";
  if (!s) return "SCHEDULED";
  return s.toUpperCase();
}

function toMatchItem(params: {
  group: number;
  round: number;
  match: FaceitBracketPayload["matches"][string];
}): FaceitChampionshipMatchItem | null {
  const { group, round, match } = params;
  if (!match?.id) return null;

  const factions = Array.isArray(match.factions) ? match.factions : [];
  const f1 = factions.find((f) => f.number === 1);
  const f2 = factions.find((f) => f.number === 2);

  const faction1 = {
    faction_id: f1?.entity?.id ?? "",
    name: f1?.entity?.name ?? "TBD",
    avatar: f1?.entity?.avatar ?? ""
  };
  const faction2 = {
    faction_id: f2?.entity?.id ?? "",
    name: f2?.entity?.name ?? "TBD",
    avatar: f2?.entity?.avatar ?? ""
  };

  const winnerFactionId =
    f1?.winner && f1?.entity?.id
      ? f1.entity.id
      : f2?.winner && f2?.entity?.id
        ? f2.entity.id
        : undefined;

  const scheduleMs = match.schedule;
  const scheduled_at =
    scheduleMs != null && Number.isFinite(scheduleMs)
      ? Math.floor(scheduleMs / 1000)
      : undefined;

  return {
    match_id: match.id,
    group,
    round,
    status: normalizeStatus(match.status),
    best_of: match.bestOf ?? 3,
    scheduled_at,
    teams: {
      faction1,
      faction2
    },
    results: {
      winner: winnerFactionId,
      score: {
        faction1: f1?.score ?? 0,
        faction2: f2?.score ?? 0
      }
    }
  };
}

async function fetchBracketGroup(
  championshipId: string,
  group: number
): Promise<FaceitChampionshipMatchItem[]> {
  const url = `https://www.faceit.com/api/championships/v1/championship/${championshipId}/group/${group}/bracket`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(
      `FaceIT bracket API error: ${res.status} ${res.statusText} for ${url}`
    );
  }
  const raw: unknown = await res.json();
  if (!isRecord(raw)) return [];
  const payload = (raw as FaceitBracketResponse).payload;
  if (
    !payload ||
    !Array.isArray(payload.rounds) ||
    !isRecord(payload.matches)
  ) {
    return [];
  }

  const roundByMatchId = new Map<string, number>();
  for (const r of payload.rounds) {
    if (!r || typeof r.number !== "number" || !Array.isArray(r.matches))
      continue;
    for (const id of r.matches) {
      if (typeof id === "string") roundByMatchId.set(id, r.number);
    }
  }

  const items: FaceitChampionshipMatchItem[] = [];
  for (const [matchId, match] of Object.entries(payload.matches)) {
    const round = roundByMatchId.get(matchId);
    if (!round) continue;
    const item = toMatchItem({ group, round, match });
    if (item) items.push(item);
  }
  return items;
}

/**
 * Fetches championship bracket matches (groups 1..3) from FaceIT web bracket API and caches them.
 *
 * Unlike the `open.faceit.com/data/v4/.../matches` feed, this includes "dummy"/placeholder matches
 * where upper-bracket losers are already seated into later lower-bracket rounds (waiting slots).
 */
export async function getChampionshipBracketMatchesCached(
  championshipId: string
): Promise<FaceitChampionshipMatchItem[]> {
  const key = getCacheKey(championshipId);
  const cached = await redisClient.get(key);
  if (cached) {
    const parsed: unknown = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      return parsed as FaceitChampionshipMatchItem[];
    }
    await redisClient.del(key);
  }

  const groups = [1, 2, 3];
  const all = (
    await Promise.all(groups.map((g) => fetchBracketGroup(championshipId, g)))
  ).flat();

  await redisClient.set(key, JSON.stringify(all), "EX", expireIn7Days);
  logger.info(
    `[Playoff] Cached ${all.length} bracket matches for championship ${championshipId}`
  );
  return all;
}
