import type { Knex } from "knex";

/**
 * Season 17 regular season kanarating top 3 trophy assignments per division.
 * Players ranked by average kana_rating (primary role, stage=1, >2 maps played).
 *
 * Divisions: Masters (1), Challengers (2), div4 (5), div5 (6), div6 (7), div7 (8), Prospects (13)
 */

const SEASON_ID = 17;

// [placement, steam_id, league_id]
const ASSIGNMENTS: [number, bigint, number][] = [
  // Masters (league_id=1)
  [1, 76561198013043470n, 1], // t666ni       — 1.269 avg, 14 maps
  [2, 76561197976941540n, 1], // ö Laars      — 1.130 avg, 14 maps
  [3, 76561198098178110n, 1], // JombaJJ      — 1.118 avg,  4 maps

  // Challengers (league_id=2)
  [1, 76561198300145840n, 2], // L4wrenceb0b  — 1.269 avg, 12 maps
  [2, 76561198367129340n, 2], // thaikhyri666 — 1.200 avg, 12 maps
  [3, 76561198238001460n, 2], // E-TWO        — 1.126 avg, 12 maps

  // div4 (league_id=5)
  [1, 76561198031467260n, 5], // zouse        — 1.309 avg, 14 maps
  [2, 76561198179368860n, 5], // ArdeW        — 1.181 avg, 14 maps
  [3, 76561198083207170n, 5], // s0rsa        — 1.138 avg, 14 maps

  // div5 (league_id=6)
  [1, 76561198049624780n, 6], // Lehtu        — 1.144 avg, 14 maps
  [2, 76561199133774370n, 6], // El mjölk     — 1.137 avg, 14 maps
  [3, 76561197981951440n, 6], // jiop         — 1.086 avg, 14 maps

  // div6 (league_id=7)
  [1, 76561198041760580n, 7], // Hjeleen      — 1.161 avg, 14 maps
  [2, 76561198056830200n, 7], // HcÄlexx      — 1.122 avg,  6 maps
  [3, 76561198263400000n, 7], // 1sin         — 1.103 avg, 14 maps

  // div7 (league_id=8)
  [1, 76561197993280780n, 8], // JESUS        — 1.153 avg, 12 maps
  [2, 76561198071626700n, 8], // Januhi       — 1.151 avg, 14 maps
  [3, 76561197977159550n, 8], // Nemezi       — 1.142 avg, 14 maps

  // Prospects (league_id=13)
  [1, 76561198045493120n, 13], // naga        — 1.144 avg, 14 maps
  [2, 76561198159480720n, 13], // VelehoW     — 1.094 avg, 14 maps
  [3, 76561198076583680n, 13] // Einari      — 1.089 avg, 14 maps
];

export async function up(knex: Knex): Promise<void> {
  const trophies = await knex("Trophies")
    .select("id", "placement")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  const trophyMap: Record<number, number> = {};
  for (const trophy of trophies) {
    trophyMap[trophy.placement] = trophy.id;
  }

  for (const [placement, steamId, leagueId] of ASSIGNMENTS) {
    const trophyId = trophyMap[placement];
    if (!trophyId) continue;

    const existing = await knex("TrophyAssignments")
      .where({
        trophy_id: trophyId,
        steam_id: steamId.toString(),
        season_id: SEASON_ID,
        league_id: leagueId
      })
      .first();

    if (!existing) {
      await knex("TrophyAssignments").insert({
        trophy_id: trophyId,
        team_id: null,
        steam_id: steamId.toString(),
        season_id: SEASON_ID,
        league_id: leagueId,
        custom_text: null
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const trophyIds = await knex("Trophies")
    .select("id")
    .whereIn("name", ["kanarating_top1", "kanarating_top2", "kanarating_top3"]);

  if (trophyIds.length > 0) {
    await knex("TrophyAssignments")
      .whereIn(
        "trophy_id",
        trophyIds.map((t) => t.id)
      )
      .where("season_id", SEASON_ID)
      .whereNotNull("steam_id")
      .delete();
  }
}
