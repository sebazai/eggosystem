import { getTeamValuesForSorter } from "../../models/sortter.models";

// This is an integration test that actually connects to the database
describe("Sortter Model Integration Tests", () => {
  it("should return correct values for CSKeisari (team_id 2053) in season 14", async () => {
    // Call the function with season 14 and isHistorical=true
    // The controller automatically uses historical mode when there are no SeasonLeagueTeams records
    const result = await getTeamValuesForSorter(14, true);

    // Find CSKeisari team in the results
    const csKeisari = result.find((team) => team.team_id === 2053);

    // Verify that we found the team
    expect(csKeisari).toBeDefined();

    // Verify specific values mentioned in the requirements
    if (csKeisari) {
      expect(csKeisari.team_name).toBe("CSKeisari");
      expect(csKeisari.top5_sum).toBe(1418);
      expect(csKeisari.avg4).toBe(288.75);
    }
  }, 10000); // Increase timeout for database query
});
