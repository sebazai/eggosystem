import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchTeams", (table) => {
    table
      .string("match_side", 16)
      .nullable()
      .comment(
        "FaceIT room alignment from match_object_created: faction1→home, faction2→away"
      );
  });

  await knex.raw(`
    ALTER TABLE MatchTeams
    ADD CONSTRAINT match_teams_match_side_check
    CHECK (match_side IS NULL OR match_side IN ('home', 'away'))
  `);

  // Backfill season 17 from deterministic latest match_object_created webhook per room + SeasonLeagueTeams mapping (NULL stays NULL).
  await knex.raw(`
    UPDATE MatchTeams mt
    INNER JOIN Matches m ON m.id = mt.match_id
      AND m.season_id = 17
      AND m.external_match_room_id IS NOT NULL
      AND TRIM(m.external_match_room_id) != ''
    INNER JOIN (
      SELECT
        d.external_payload_id AS room_id,
        JSON_UNQUOTE(JSON_EXTRACT(d.details, '$.teams.faction1.faction_id')) AS f1,
        JSON_UNQUOTE(JSON_EXTRACT(d.details, '$.teams.faction2.faction_id')) AS f2
      FROM (
        SELECT
          fw.external_payload_id,
          fw.details,
          ROW_NUMBER() OVER (
            PARTITION BY fw.external_payload_id
            ORDER BY fw.received_at DESC, fw.id DESC
          ) AS rn
        FROM FaceitWebhooks fw
        WHERE fw.event = 'match_object_created'
      ) d
      WHERE d.rn = 1
        AND JSON_TYPE(JSON_EXTRACT(d.details, '$.teams')) = 'OBJECT'
    ) wb ON wb.room_id = m.external_match_room_id
    INNER JOIN SeasonLeagueTeams slt_home
      ON slt_home.season_id = 17
      AND slt_home.external_team_id = wb.f1
    INNER JOIN SeasonLeagueTeams slt_away
      ON slt_away.season_id = 17
      AND slt_away.external_team_id = wb.f2
      AND slt_away.team_id <> slt_home.team_id
    SET mt.match_side = CASE mt.team_id
      WHEN slt_home.team_id THEN 'home'
      WHEN slt_away.team_id THEN 'away'
    END
    WHERE wb.f1 IS NOT NULL AND wb.f1 != ''
      AND wb.f2 IS NOT NULL AND wb.f2 != ''
      AND mt.team_id IN (slt_home.team_id, slt_away.team_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE MatchTeams
    DROP CONSTRAINT match_teams_match_side_check
  `);
  await knex.schema.alterTable("MatchTeams", (table) => {
    table.dropColumn("match_side");
  });
}
