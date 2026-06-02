import { runQuery } from "../db/mysqlRunQuery";

/**
 * DB invariant tests for KanaRating 3.2 event tables.
 *
 * RoundSwingEvents.delta, FlashEvents flash-type flags, and
 * PlayerHitLogs.is_kill_hit are VIRTUAL GENERATED — the DB enforces
 * them structurally; these tests document and regression-check the rules.
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
         WHERE NOT (
                 pkl.ct_buy_type COLLATE utf8mb4_unicode_ci <=>
                 mrs.ct_buy_type COLLATE utf8mb4_unicode_ci
               )
            OR NOT (
                 pkl.t_buy_type COLLATE utf8mb4_unicode_ci <=>
                 mrs.t_buy_type COLLATE utf8mb4_unicode_ci
               )
         LIMIT 5`
      );
      expect(rows).toHaveLength(0);
    });
  });
});
