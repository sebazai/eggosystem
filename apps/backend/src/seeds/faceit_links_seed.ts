import { runQuery } from "../db/mysqlRunQuery";

export const seedFaceitLinks = async () => {
  // First, check if we already have data
  const existingData = await runQuery<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM SeasonLeagueExternalIds"
  );

  if (existingData[0].count > 0) {
    console.log("Faceit links data already exists, skipping seed");
    return;
  }

  // Get the active season ID
  const activeSeasons = await runQuery<{ id: number }[]>(
    "SELECT id FROM Seasons WHERE end_date IS NULL OR end_date > CURDATE() LIMIT 1"
  );

  if (activeSeasons.length === 0) {
    console.log("No active season found, skipping Faceit links seed");
    return;
  }

  const seasonId = activeSeasons[0].id;

  // Get league IDs
  const leagues = await runQuery<
    { id: number; name: string; sort_priority: number }[]
  >(
    "SELECT id, name, sort_priority FROM Leagues ORDER BY sort_priority ASC LIMIT 6"
  );

  if (leagues.length === 0) {
    console.log("No leagues found, skipping Faceit links seed");
    return;
  }

  // Insert sample data
  const faceitLinks = leagues.map((league) => ({
    season_id: seasonId,
    league_id: league.id,
    stage_id: 1, // Regular stage
    external_id: `faceit-${seasonId}-${league.id}-${Math.floor(Math.random() * 10000)}`,
    external_league_name: `${league.name} Division`,
    type: ["roundRobin", "doubleElimination", "singleElimination"][
      Math.floor(Math.random() * 3)
    ],
    isBO2PlayedAs2xBO1: Math.random() > 0.5
  }));

  // Insert the data
  for (const link of faceitLinks) {
    await runQuery(
      `INSERT INTO SeasonLeagueExternalIds 
       (season_id, league_id, stage_id, external_id, external_league_name, type, isBO2PlayedAs2xBO1) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        link.season_id,
        link.league_id,
        link.stage_id,
        link.external_id,
        link.external_league_name,
        link.type,
        link.isBO2PlayedAs2xBO1
      ]
    );
  }

  console.log(
    `Inserted ${faceitLinks.length} Faceit links for season ${seasonId}`
  );
};

// Run the seed if this file is executed directly
if (require.main === module) {
  seedFaceitLinks()
    .then(() => {
      console.log("Faceit links seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding Faceit links:", error);
      process.exit(1);
    });
}
