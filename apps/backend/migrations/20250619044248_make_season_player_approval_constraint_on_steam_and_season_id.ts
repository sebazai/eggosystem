import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First, drop all foreign key constraints that might interfere
  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_steam_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_season_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_organization_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_team_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_approved_by_id_foreign
  `);

  // Now drop the unique constraint
  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP INDEX unique_steam_id_season_id_organization_id_team_id
  `);

  // Recreate the foreign key constraints
  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_steam_id_foreign 
    FOREIGN KEY (steam_id) REFERENCES SteamPlayers (steam_id)
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_season_id_foreign 
    FOREIGN KEY (season_id) REFERENCES Seasons (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_organization_id_foreign 
    FOREIGN KEY (organization_id) REFERENCES Organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_team_id_foreign 
    FOREIGN KEY (team_id) REFERENCES Teams (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_approved_by_id_foreign 
    FOREIGN KEY (approved_by_id) REFERENCES Accounts (id) ON DELETE SET NULL ON UPDATE CASCADE
  `);

  // Add new unique constraint on steam_id and season_id only
  await knex.schema.alterTable("SeasonPlayerApprovals", (table) => {
    table.unique(["steam_id", "season_id"], {
      indexName: "unique_steam_id_season_id"
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the new unique constraint
  await knex.schema.alterTable("SeasonPlayerApprovals", (table) => {
    table.dropUnique(["steam_id", "season_id"], "unique_steam_id_season_id");
  });

  // Drop foreign key constraints again
  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_steam_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_season_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_organization_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_team_id_foreign
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    DROP FOREIGN KEY seasonplayerapprovals_approved_by_id_foreign
  `);

  // Restore the original unique constraint
  await knex.schema.alterTable("SeasonPlayerApprovals", (table) => {
    table.unique(["steam_id", "season_id", "organization_id", "team_id"], {
      indexName: "unique_steam_id_season_id_organization_id_team_id"
    });
  });

  // Recreate the foreign key constraints
  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_steam_id_foreign 
    FOREIGN KEY (steam_id) REFERENCES SteamPlayers (steam_id)
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_season_id_foreign 
    FOREIGN KEY (season_id) REFERENCES Seasons (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_organization_id_foreign 
    FOREIGN KEY (organization_id) REFERENCES Organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_team_id_foreign 
    FOREIGN KEY (team_id) REFERENCES Teams (id) ON DELETE CASCADE ON UPDATE CASCADE
  `);

  await knex.raw(`
    ALTER TABLE SeasonPlayerApprovals 
    ADD CONSTRAINT seasonplayerapprovals_approved_by_id_foreign 
    FOREIGN KEY (approved_by_id) REFERENCES Accounts (id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
}
