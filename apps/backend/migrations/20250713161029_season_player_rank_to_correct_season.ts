import type { Knex } from "knex";

interface OldRankData {
  steamID: string;
  rank?: number | null;
  cs2rank?: number | null;
  level?: number | null;
  kukkoDate?: string | null;
  faceDate?: string | null;
  hours?: number | null;
  faceELO?: number | null;
  kanaelo?: number | null;
  fkd?: number | null;
  ekd?: number | null;
  esportalElo?: number | null;
  esportalRank?: number | null;
  calculus?: string | null;
}

interface SanitizedRankData {
  rank_updated_at: string | null;
  csgo_rank: number | null;
  cs2_rank: number | null;
  cs_hours: number | null;
  faceit_level: number | null;
  faceit_elo: number | null;
  faceit_kd: number | null;
  faceit_date: string | null;
  kana_elo: number;
  esportal_kd: number | null;
  esportal_elo: number | null;
  esportal_rank: number | null;
  hours_updated_at: string | null;
  manual_external_rank: number;
  manual_steam_rank: number;
}

export async function up(knex: Knex): Promise<void> {
  // Change csgo_rank default from -1 to null
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.integer("csgo_rank").defaultTo(null).alter();
  });

  // Remove all SeasonPlayerRanks except season_id 16
  await knex("SeasonPlayerRanks").whereNot("season_id", 16).del();

  // Update all season_id 16 records to set csgo_rank to null
  await knex("SeasonPlayerRanks")
    .where("season_id", 16)
    .update({ csgo_rank: null });

  // Define the mapping of old table names to season IDs
  const tableSeasonMapping = [
    { tableName: "ranks_old_s10", seasonId: 10 },
    { tableName: "ranks_s11", seasonId: 11 },
    { tableName: "ranks_s12", seasonId: 12 },
    { tableName: "ranks_s13", seasonId: 13 },
    { tableName: "ranks_s14", seasonId: 14 },
    { tableName: "ranks", seasonId: 15 } // ranks table is for season 15
  ];

  // Process each old table
  for (const mapping of tableSeasonMapping) {
    const { tableName, seasonId } = mapping;

    // Check if the old table exists
    const tableExists = await knex.schema.hasTable(tableName);
    if (!tableExists) {
      continue;
    }

    // Get all players who participated in this season
    const seasonPlayers = await knex("SeasonTeamPlayers")
      .where("season_id", seasonId)
      .select("steam_id")
      .distinct();

    const seasonPlayerSteamIds = seasonPlayers.map((p) => p.steam_id);

    if (seasonPlayerSteamIds.length === 0) {
      continue;
    }

    // Get all ranks from the old table
    const oldRanks = await knex(tableName).select("*");

    for (const oldRank of oldRanks) {
      // Validate and convert steamID
      let steamId: bigint;
      try {
        // Clean the steamID - remove any non-numeric characters except digits
        const cleanSteamId = oldRank.steamID.toString().replace(/[^0-9]/g, "");

        if (!cleanSteamId || cleanSteamId.length === 0) {
          continue;
        }

        steamId = BigInt(cleanSteamId);
      } catch (_error) {
        continue;
      }

      // Only process if player participated in this season
      if (!seasonPlayerSteamIds.includes(steamId.toString())) {
        continue;
      }

      // Sanitize values - remove negative values and ensure kana_elo exists
      const sanitizedRank = sanitizeRankData(oldRank);

      if (!sanitizedRank) {
        continue;
      }

      // Check if rank already exists for this player and season
      const existingRank = await knex("SeasonPlayerRanks")
        .where({ steam_id: steamId, season_id: seasonId })
        .first();

      if (existingRank) {
        // Update existing record
        await knex("SeasonPlayerRanks")
          .where({ id: existingRank.id })
          .update(sanitizedRank);
      } else {
        // Insert new record
        await knex("SeasonPlayerRanks").insert({
          steam_id: steamId,
          season_id: seasonId,
          ...sanitizedRank
        });
      }
    }
  }
}

function sanitizeRankData(oldRank: OldRankData): SanitizedRankData | null {
  // Helper function to sanitize a single value
  const sanitizeValue = (
    value: number | null | undefined,
    minValue: number = 0,
    maxValue?: number
  ): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return null;
    }
    // For csgo_rank, treat -1 as null instead of filtering it out
    if (numValue === -1) {
      return null;
    }
    if (numValue < minValue) {
      return null;
    }
    if (maxValue !== undefined && numValue > maxValue) {
      return null;
    }
    return numValue;
  };

  // Helper function to sanitize decimal values
  const sanitizeDecimal = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const numValue = Number(value);
    return isNaN(numValue) || numValue < 0 ? null : numValue;
  };

  // Sanitize kana_elo - this is required and must be greater than 0
  const kanaElo = sanitizeValue(oldRank.kanaelo, 1);
  if (kanaElo === null) {
    return null; // Skip if kana_elo is missing, invalid, or 0
  }

  // Map old field names to new field names and sanitize
  const sanitizedData: SanitizedRankData = {
    rank_updated_at:
      oldRank.kukkoDate && oldRank.kukkoDate !== "1970-01-01 10:00:00"
        ? oldRank.kukkoDate
        : null,
    csgo_rank: sanitizeValue(oldRank.rank, 0, 20),
    cs2_rank: sanitizeValue(oldRank.cs2rank, 1000),
    cs_hours: sanitizeValue(oldRank.hours),
    faceit_level: (() => {
      const level = sanitizeValue(oldRank.level);
      const elo = sanitizeValue(oldRank.faceELO, 1); // faceit_elo should not be 0
      const kd = sanitizeDecimal(oldRank.fkd);

      // Check for placeholder pattern - same as esportal
      if (elo === 1150 && level === 3 && kd === 0.95) {
        return null;
      }

      // If level is null but we have ELO, convert ELO to level
      if (level === null && elo !== null) {
        return faceitEloToLevel(elo);
      }
      return level;
    })(),
    faceit_elo: (() => {
      const level = sanitizeValue(oldRank.level);
      const elo = sanitizeValue(oldRank.faceELO, 1); // faceit_elo should not be 0
      const kd = sanitizeDecimal(oldRank.fkd);

      // Check for placeholder pattern - same as esportal
      if (elo === 1150 && level === 3 && kd === 0.95) {
        return null;
      }

      return elo;
    })(),
    faceit_kd: (() => {
      const kd = sanitizeDecimal(oldRank.fkd);
      const elo = sanitizeValue(oldRank.faceELO, 1);
      const level = sanitizeValue(oldRank.level);

      // Check for placeholder pattern - same as esportal
      if (elo === 1150 && level === 3 && kd === 0.95) {
        return null;
      }

      // If KD is null but we have ELO or level, set default KD to 0.5
      if (kd === null && (elo !== null || level !== null)) {
        return 0.5;
      }
      return kd;
    })(),
    faceit_date:
      oldRank.faceDate && oldRank.faceDate !== "1970-01-01 10:00:00"
        ? oldRank.faceDate
        : null,
    kana_elo: kanaElo,
    esportal_kd: (() => {
      const kd = sanitizeDecimal(oldRank.ekd);
      const elo = sanitizeValue(oldRank.esportalElo);
      const rank = sanitizeValue(oldRank.esportalRank);

      // Check for placeholder patterns: rank 3 or level 1 with same ELO/KD
      if (kd === 0.95 && elo === 1150 && (rank === 3 || rank === 1)) {
        return null;
      }
      return kd;
    })(),
    esportal_elo: (() => {
      const kd = sanitizeDecimal(oldRank.ekd);
      const elo = sanitizeValue(oldRank.esportalElo);
      const rank = sanitizeValue(oldRank.esportalRank);

      // Check for placeholder patterns: rank 3 or level 1 with same ELO/KD
      if (kd === 0.95 && elo === 1150 && (rank === 3 || rank === 1)) {
        return null;
      }
      return elo;
    })(),
    esportal_rank: (() => {
      const kd = sanitizeDecimal(oldRank.ekd);
      const elo = sanitizeValue(oldRank.esportalElo);
      const rank = sanitizeValue(oldRank.esportalRank);

      // Check for placeholder patterns: rank 3 or level 1 with same ELO/KD
      if (kd === 0.95 && elo === 1150 && (rank === 3 || rank === 1)) {
        return null;
      }
      return rank;
    })(),
    hours_updated_at:
      oldRank.kukkoDate && oldRank.kukkoDate !== "1970-01-01 10:00:00"
        ? oldRank.kukkoDate
        : null,
    manual_external_rank: 0,
    manual_steam_rank: 0
  };

  return sanitizedData;
}

function faceitEloToLevel(elo: number): number {
  // FACEIT level conversion based on ELO ranges
  if (elo >= 2000) return 10;
  if (elo >= 1850) return 9;
  if (elo >= 1700) return 8;
  if (elo >= 1550) return 7;
  if (elo >= 1400) return 6;
  if (elo >= 1250) return 5;
  if (elo >= 1100) return 4;
  if (elo >= 950) return 3;
  if (elo >= 800) return 2;
  return 1;
}

export async function down(_knex: Knex): Promise<void> {
  // Unreversible - this migration imports data from old tables
  // and removes existing data, so we can't safely reverse it
}
