import { type ChampionshipCreatedWebhook } from "@eggosystem/types";
import { getOrganizerFaceitSeasonForApp } from "../models/organizer.models";
import {
  getSeasonLeagueBySeasonAndFaceitName,
  getSeasonLeagueSearchNames
} from "../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../models/season-league-external-id.models";
import { convertFaceitGameToAppId } from "./faceit.services";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Normalizes a league name token so "Div5"/"Div6" map to "5"/"6" for lookup
 * (DB stores leagues as "div5", "div11"; searchName is "5", "11").
 */
const normalizeLeagueToken = (token: string): string => {
  const divMatch = token.match(/^Div(\d+)$/i);
  return divMatch ? divMatch[1] : token;
};

/**
 * Resolves the league search name (for getSeasonLeagueBySeasonAndFaceitName) by matching
 * the championship name against known league names for the season. Uses word-boundary
 * matching and prefers longest match (e.g. "11" over "1"). Treats "Div5"/"Div6" in the
 * name as equivalent to "5"/"6". Falls back to first word of the championship name
 * (with DivN normalized to N) if no league matches.
 */
export const resolveLeagueNameFromChampionshipName = async (
  championshipName: string,
  seasonId: number
): Promise<string> => {
  const raw = await getSeasonLeagueSearchNames(seasonId);
  const leagueNames = Array.isArray(raw) ? raw : [];
  const sorted = [...leagueNames].sort(
    (a, b) => b.searchName.length - a.searchName.length
  );
  const wordBoundaryMatch = (searchName: string) =>
    new RegExp(`\\b${escapeRegex(searchName)}\\b`, "i").test(championshipName);
  const matchDivVariant = (searchName: string) =>
    /^\d+$/.test(searchName) && wordBoundaryMatch("Div" + searchName);
  const matched = sorted.find(
    ({ searchName }) =>
      wordBoundaryMatch(searchName) || matchDivVariant(searchName)
  );
  if (matched) return matched.searchName;
  const firstWord = championshipName.trim().split(/\s+/)[0];
  return normalizeLeagueToken(firstWord ?? "");
};

/**
 * Parses manual group number from a name containing "Lohko X" (anywhere in the string).
 * - Single letter A–Z → 1–26 (e.g. Lohko A → 1, Lohko C → 3).
 * - Positive integer → that number (e.g. Lohko 3 → 3).
 * Returns null if no match or value is not a letter or positive integer.
 */
export const extractManualGroupFromName = (name: string): number | null => {
  const match = name.match(/Lohko\s+(\w+)/i);
  if (!match) return null;
  const value = match[1];
  if (/^[A-Z]$/i.test(value)) return value.toUpperCase().charCodeAt(0) - 64;
  const num = parseInt(value, 10);
  return Number.isInteger(num) && num > 0 ? num : null;
};

/**
 * Maps championship type to stage id: roundRobin → 1 (regular), doubleElimination → 2 (playoff), default → 1.
 */
export const stageFromChampionshipType = (type: string): 1 | 2 =>
  type === "roundRobin" ? 1 : type === "doubleElimination" ? 2 : 1;

/**
 * Extracts a season hint (e.g. "S5" or "Season 5") from a name string for use in season lookup.
 * Matches "S5", "S 5" or "Season 5", "Season  5" etc. Returns empty string if no match.
 */
export const extractSeasonHintFromName = (name: string): string => {
  const matchesSX = name.match(/S\s*(\d+)/);
  const matchesSeason = name.match(/Season\s*(\d+)/);
  return matchesSX
    ? `S${matchesSX[1]}`
    : matchesSeason
      ? `Season ${matchesSeason[1]}`
      : "";
};

export const addChampionshipToDatabase = async (
  championship: ChampionshipCreatedWebhook
) => {
  const externalChampionshipId = championship.payload.id;
  const externalChampionshipName = championship.payload.name;
  const seasonHint = extractSeasonHintFromName(externalChampionshipName);
  const faceitOrganizerId = championship.payload.organizer_id;
  const activeOrganizerSeason = await getOrganizerFaceitSeasonForApp(
    faceitOrganizerId,
    seasonHint,
    convertFaceitGameToAppId(championship.app_id)
  );

  if (!activeOrganizerSeason) {
    throw new Error("No active organizer season found");
  }

  const championshipType = championship.payload.type;
  const stage = stageFromChampionshipType(championshipType);
  const leagueName = await resolveLeagueNameFromChampionshipName(
    externalChampionshipName,
    activeOrganizerSeason.id
  );
  const manualGroupNumber = extractManualGroupFromName(
    externalChampionshipName
  );

  const seasonLeague = await getSeasonLeagueBySeasonAndFaceitName(
    activeOrganizerSeason.id,
    leagueName
  );

  if (!seasonLeague) {
    throw new Error("Season league not found");
  }

  await insertSeasonLeagueExternalId(
    externalChampionshipId,
    externalChampionshipName,
    seasonLeague.season_id,
    seasonLeague.league_id,
    stage,
    championshipType,
    manualGroupNumber
  );
};
