import {
  SeasonPlatform,
  playerMeetsSeasonRankAndHoursRequirements
} from "@eggosystem/types";

describe("playerMeetsSeasonRankAndHoursRequirements", () => {
  const basePlayer = { rank: 1, externalRank: 1, hours: 100 };

  it("returns true when FaceIT rank is required but platform is Kanaliiga and external rank is missing", () => {
    expect(
      playerMeetsSeasonRankAndHoursRequirements(
        {
          premier_rank_required: false,
          faceit_rank_required: true,
          hours_played_required: false,
          platform: SeasonPlatform.Kanaliiga
        },
        { ...basePlayer, externalRank: -1 }
      )
    ).toBe(true);
  });

  it("returns false when FaceIT rank is required on FACEIT and external rank is missing", () => {
    expect(
      playerMeetsSeasonRankAndHoursRequirements(
        {
          premier_rank_required: false,
          faceit_rank_required: true,
          hours_played_required: false,
          platform: SeasonPlatform.FACEIT
        },
        { ...basePlayer, externalRank: -1 }
      )
    ).toBe(false);
  });

  it("treats missing season details as no rank/hours blockers", () => {
    expect(
      playerMeetsSeasonRankAndHoursRequirements(undefined, {
        ...basePlayer,
        rank: -1,
        externalRank: -1,
        hours: -1
      })
    ).toBe(true);
  });
});
