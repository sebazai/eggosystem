import { runQuery } from "../db/mysqlRunQuery";

/**
 * DB invariant tests for KanaRating 3.2 event tables.
 *
 * Run these BEFORE applying migration 20260601000000 to confirm that
 * all derived/redundant columns are consistent with their source data.
 *
 * After the migration:
 * - RoundSwingEvents.delta, FlashEvents flash-type flags, and
 *   PlayerHitLogs.is_kill_hit become VIRTUAL GENERATED — these tests
 *   remain valid as documentation (the DB now enforces them structurally).
 * - The "RoundUtilitySummary pre-migration" tests become inapplicable
 *   once those columns are dropped.
 */

describe("KanaRating 3.2 — DB invariants", () => {
  describe("RoundSwingEvents", () => {
    it("delta equals post_win_prob minus pre_win_prob for all rows", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM RoundSwingEvents
         WHERE ABS(delta - (post_win_prob - pre_win_prob)) > 0.0001
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("FlashEvents", () => {
    it("is_enemy_flash matches thrower_team != victim_team", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM FlashEvents
         WHERE is_enemy_flash != (thrower_team != victim_team)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });

    it("is_self_flash matches thrower_steam_id = victim_steam_id", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM FlashEvents
         WHERE is_self_flash != (thrower_steam_id = victim_steam_id)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });

    it("is_teammate_flash matches thrower_team = victim_team AND different players", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM FlashEvents
         WHERE is_teammate_flash !=
               (thrower_team = victim_team AND thrower_steam_id != victim_steam_id)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });

    it("flash type flags are mutually exclusive — at most one true per row", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM FlashEvents
         WHERE (is_enemy_flash + is_teammate_flash + is_self_flash) > 1
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("PlayerHitLogs", () => {
    it("is_kill_hit matches health_remaining = 0", async () => {
      const rows = await runQuery<{ id: number }[]>(
        `SELECT id FROM PlayerHitLogs
         WHERE is_kill_hit != (health_remaining = 0)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });

  // These three tests are only valid before migration 20260601000000 drops
  // enemies_flashed, teammates_flashed, and wasted_utility from RoundUtilitySummary.
  describe("RoundUtilitySummary — pre-migration consistency", () => {
    it("enemies_flashed matches FlashEvents count per round per player", async () => {
      const rows = await runQuery<
        { match_game_id: number; round_number: number; steam_id: string }[]
      >(
        `SELECT rus.match_game_id, rus.round_number, rus.steam_id
         FROM RoundUtilitySummary rus
         LEFT JOIN (
           SELECT match_game_id, round_number, thrower_steam_id, COUNT(*) AS cnt
           FROM FlashEvents
           WHERE is_enemy_flash = 1
           GROUP BY match_game_id, round_number, thrower_steam_id
         ) fe ON fe.match_game_id = rus.match_game_id
              AND fe.round_number = rus.round_number
              AND fe.thrower_steam_id = rus.steam_id
         WHERE rus.enemies_flashed != COALESCE(fe.cnt, 0)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });

    it("teammates_flashed matches FlashEvents count per round per player", async () => {
      const rows = await runQuery<
        { match_game_id: number; round_number: number; steam_id: string }[]
      >(
        `SELECT rus.match_game_id, rus.round_number, rus.steam_id
         FROM RoundUtilitySummary rus
         LEFT JOIN (
           SELECT match_game_id, round_number, thrower_steam_id, COUNT(*) AS cnt
           FROM FlashEvents
           WHERE is_teammate_flash = 1
           GROUP BY match_game_id, round_number, thrower_steam_id
         ) fe ON fe.match_game_id = rus.match_game_id
              AND fe.round_number = rus.round_number
              AND fe.thrower_steam_id = rus.steam_id
         WHERE rus.teammates_flashed != COALESCE(fe.cnt, 0)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });

    it("wasted_utility matches WastedUtilityEvents count per round per player", async () => {
      const rows = await runQuery<
        { match_game_id: number; round_number: number; steam_id: string }[]
      >(
        `SELECT rus.match_game_id, rus.round_number, rus.steam_id
         FROM RoundUtilitySummary rus
         LEFT JOIN (
           SELECT match_game_id, round_number, thrower_steam_id, COUNT(*) AS cnt
           FROM WastedUtilityEvents
           GROUP BY match_game_id, round_number, thrower_steam_id
         ) wue ON wue.match_game_id = rus.match_game_id
               AND wue.round_number = rus.round_number
               AND wue.thrower_steam_id = rus.steam_id
         WHERE rus.wasted_utility != COALESCE(wue.cnt, 0)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe("PlayerKillLogs — denormalization sync", () => {
    it("ct_buy_type and t_buy_type match MapRoundStats for all kill rows", async () => {
      const rows = await runQuery<
        { match_game_id: number; round_number: number }[]
      >(
        `SELECT pkl.match_game_id, pkl.round_number
         FROM PlayerKillLogs pkl
         JOIN MapRoundStats mrs
           ON mrs.match_game_id = pkl.match_game_id
          AND mrs.round_number = pkl.round_number
         WHERE NOT (pkl.ct_buy_type <=> mrs.ct_buy_type)
            OR NOT (pkl.t_buy_type <=> mrs.t_buy_type)
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });
});
