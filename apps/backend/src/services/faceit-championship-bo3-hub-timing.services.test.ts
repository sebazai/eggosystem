import { isChampionshipBo3PlusHubTimingEligible } from "./faceit-championship-bo3-hub-timing.services";

describe("isChampionshipBo3PlusHubTimingEligible", () => {
  it("is false when best_of is below 3", () => {
    expect(
      isChampionshipBo3PlusHubTimingEligible({
        faceitBestOf: 2,
        isRoundRobinBo2As2xBo1: false,
        matchesInRoomCount: 1
      })
    ).toBe(false);
  });

  it("is false when best_of is undefined", () => {
    expect(
      isChampionshipBo3PlusHubTimingEligible({
        faceitBestOf: undefined,
        isRoundRobinBo2As2xBo1: false,
        matchesInRoomCount: 1
      })
    ).toBe(false);
  });

  it("is false for 2×BO1 twin rows (round-robin BO2 as 2×BO1)", () => {
    expect(
      isChampionshipBo3PlusHubTimingEligible({
        faceitBestOf: 3,
        isRoundRobinBo2As2xBo1: true,
        matchesInRoomCount: 2
      })
    ).toBe(false);
  });

  it("is true for BO3 with one row", () => {
    expect(
      isChampionshipBo3PlusHubTimingEligible({
        faceitBestOf: 3,
        isRoundRobinBo2As2xBo1: false,
        matchesInRoomCount: 1
      })
    ).toBe(true);
  });

  it("is true for playoff BO3 in a 2×BO1 season (single row)", () => {
    expect(
      isChampionshipBo3PlusHubTimingEligible({
        faceitBestOf: 3,
        isRoundRobinBo2As2xBo1: true,
        matchesInRoomCount: 1
      })
    ).toBe(true);
  });
});
