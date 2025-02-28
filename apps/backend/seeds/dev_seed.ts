import { Knex } from "knex";
import * as fs from "fs";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex.raw("DELETE FROM SeasonPlayerRanks");
  await knex.raw("DELETE FROM PlayerStats");
  await knex.raw("DELETE FROM PlayerTrades");
  await knex.raw("DELETE FROM TeamRosters");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM Reservations");
  await knex.raw("DELETE FROM SeasonTeamPlayers");
  await knex.raw("DELETE FROM Players");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM SeasonLeagueTeams");
  await knex.raw("DELETE FROM SeasonLeagues");
  await knex.raw("DELETE FROM SeasonTeamRegistrations");
  await knex.raw("DELETE FROM Teams");
  await knex.raw("DELETE FROM Organizations");
  await knex.raw("DELETE FROM Seasons");
  await knex.raw("DELETE FROM Games");
  await knex.raw("DELETE FROM Maps");
  await knex.raw("DELETE FROM knex_migrations");
  await knex.raw("DELETE FROM knex_migrations_lock");

  const file = fs.readFileSync("./seeds/dev/kana_dev_test_seed.sql", "utf8");
  const statements = file.split(/;\n/g);
  for (const statement of statements) {
    if (statement) {
      await knex.raw(statement);
    }
  }
}
