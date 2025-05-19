import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Duplicates.
  await knex.raw("DELETE FROM Organizations WHERE id = 207;");
  await knex.raw("DELETE FROM Organizations WHERE id = 172;");
  await knex.raw("DELETE FROM Organizations WHERE id = 44;");
  await knex.raw("DELETE FROM Organizations WHERE id = 232;");
  await knex.raw("UPDATE Teams SET organization_id = 94 WHERE id = 594");
  await knex.raw(
    "UPDATE Organizations SET organization_code = '0112038-9', name = 'Nokia Oyj', website = 'https://www.nokia.com/' WHERE id = 104"
  );

  const missingLogos = `
    UPDATE Organizations SET logo = 'S9_1145.png' WHERE id = 108;
    UPDATE Organizations SET logo = 'S15_2129.png' WHERE id = 193;
    UPDATE Organizations SET logo = 'S10_1324.png' WHERE id = 128;
    UPDATE Organizations SET logo = 'S11_1501.png' WHERE id = 86;
    UPDATE Organizations SET logo = 'S15_2154.png' WHERE id = 94;
    UPDATE Organizations SET logo = 'S15_2138.png' WHERE id = 32;
    UPDATE Organizations SET logo = 'S10_1192.png' WHERE id = 181;
    UPDATE Organizations SET logo = 'S15_2122.svg' WHERE id = 210;
    UPDATE Organizations SET logo = 'S15_2260.png' WHERE id = 2;
    UPDATE Organizations SET logo = 'S15_2235.png' WHERE id = 131;
    UPDATE Organizations SET logo = 'S11_1577.png' WHERE id = 109;
    UPDATE Organizations SET logo = 'S15_2142.png' WHERE id = 226;
    UPDATE Organizations SET logo = 'etteplan.png' WHERE id = 5;
    UPDATE Organizations SET logo = 'S11_1434.png' WHERE id = 184;
    UPDATE Organizations SET logo = 'S8_870.png' WHERE id = 98;
  `;

  const missingTeamLogos = `
    UPDATE Teams SET team_logo = 'S9_1145.png' WHERE id IN (12, 87, 202);
    UPDATE Teams SET team_logo = 'S15_2129.png' WHERE id IN (2129);
    UPDATE Teams SET team_logo = 'S10_1324.png' WHERE id IN (1149);
    UPDATE Teams SET team_logo = 'S11_1501.png' WHERE id IN (376);
    UPDATE Teams SET team_logo = 'S15_2154.png' WHERE id IN (594);
    UPDATE Teams SET team_logo = 'S14_2102.png' WHERE id IN (1523);
    UPDATE Teams SET team_logo = 'S15_2138.png' WHERE id IN (1034);
    UPDATE Teams SET team_logo = 'S10_1192.png' WHERE id IN (1192);
    UPDATE Teams SET team_logo = 'S15_2122.svg' WHERE id IN (2018);
    UPDATE Teams SET team_logo = 'S15_2260.png' WHERE id IN (2260);
    UPDATE Teams SET team_logo = 'S15_2235.png' WHERE id IN (327);
    UPDATE Teams SET team_logo = 'S15_2142.png' WHERE id IN (1988, 1989, 2036);
    UPDATE Teams SET team_logo = 'S13_1894.png' WHERE id IN (282);
    UPDATE Teams SET team_logo = 'etteplan.png' WHERE id IN (23, 24, 100);
    UPDATE Teams SET team_logo = 'S13_1880.png' WHERE id IN (1434, 1880);
    UPDATE Teams SET team_logo = 'S8_870.png' WHERE id IN (1122, 870);
  `;

  const splittedStatements = missingLogos.split(";");
  for (const statement of splittedStatements) {
    if (statement.trim()) {
      await knex.raw(statement);
    }
  }

  const splittedTeamStatements = missingTeamLogos.split(";");
  for (const statement of splittedTeamStatements) {
    if (statement.trim()) {
      await knex.raw(statement);
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
