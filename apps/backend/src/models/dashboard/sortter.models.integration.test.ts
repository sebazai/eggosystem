import { getTeamValuesForSortter } from "./sortter.models";

// This is an integration test that actually connects to the database
describe.skip("Sortter Model Integration Tests", () => {
  it("should return correct values for CSKeisari (team_id 2053) in season 14", async () => {
    // Call the function with season 14 and isHistorical=true
    // The controller automatically uses historical mode when there are no SeasonLeagueTeams records
    const result = await getTeamValuesForSortter(14);

    // Find CSKeisari team in the results
    const csKeisari = result.find((team) => team.team_id === 2053);

    // Verify that we found the team
    expect(csKeisari).toBeDefined();

    // Verify specific values mentioned in the requirements
    if (csKeisari) {
      expect(csKeisari.team_name).toBe("CSKeisari");
      expect(csKeisari.top5_sum).toBe(1418);
      // avg5 = 1418 / 5 = 283.6
      expect(csKeisari.avg5).toBe(283.6);
    }
  }, 10000); // Increase timeout for database query
});
