import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // `Reservations.hash` is used as a public removal token; ensure fast lookup and
  // enforce uniqueness so collision-retry logic is meaningful.
  //
  // Guard deployment: if historical data contains duplicates, dedupe by regenerating
  // the token for all but the first row (lowest id) per duplicate group.
  const duplicates = await knex.raw<
    [Array<{ hash: string; ids: string }>, unknown]
  >(
    `
      SELECT
        hash,
        GROUP_CONCAT(id ORDER BY id SEPARATOR ',') AS ids
      FROM Reservations
      WHERE hash IS NOT NULL AND hash <> ''
      GROUP BY hash
      HAVING COUNT(*) > 1
    `
  );

  for (const row of duplicates[0]) {
    const ids = row.ids.split(",").map((id: string) => Number(id));
    const idsToUpdate = ids.slice(1);
    for (const id of idsToUpdate) {
      await knex.raw(
        `
          UPDATE Reservations
          SET hash = CONCAT(
            LOWER(REPLACE(UUID(), '-', '')),
            LOWER(REPLACE(UUID(), '-', ''))
          )
          WHERE id = ?
        `,
        [id]
      );
    }
  }

  await knex.raw(`
    CREATE UNIQUE INDEX idx_reservations_hash_unique
    ON Reservations(hash)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX idx_reservations_hash_unique ON Reservations`);
}
