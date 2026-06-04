import {
  isFaceitRankEnforcedForSignup,
  pickSignupRankRequirements,
  playerMeetsSeasonRankAndHoursRequirements,
  shouldFetchSignupPlayerExternalRank,
  shouldFetchSignupPlayerHours,
  shouldFetchSignupPlayerPremierRank
} from "./requirements";
import { SeasonPlatform } from "../enums";
import { SeasonDetails } from "../seasons";

describe("signup fetch helpers", () => {
  it("does not fetch optional stats when all requirements are off", () => {
    const season = {
      faceit_rank_required: false,
      premier_rank_required: false,
      hours_played_required: false,
      platform: SeasonPlatform.FACEIT
    } as SeasonDetails;
    expect(shouldFetchSignupPlayerHours(season)).toBe(false);
    expect(shouldFetchSignupPlayerPremierRank(season)).toBe(false);
    expect(shouldFetchSignupPlayerExternalRank(season)).toBe(false);
  });

  it("does not enforce FaceIT rank on Kanaliiga even when faceit_rank_required is true", () => {
    const season = {
      faceit_rank_required: true,
      platform: SeasonPlatform.Kanaliiga
    } as SeasonDetails;
    expect(isFaceitRankEnforcedForSignup(season)).toBe(false);
    expect(shouldFetchSignupPlayerExternalRank(season)).toBe(false);
  });
});

describe("pickSignupRankRequirements", () => {
  it("returns default requirements when season is null", () => {
    const result = pickSignupRankRequirements(null);
    expect(result).toEqual({
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    });
  });

  it("returns default requirements when season is undefined", () => {
    const result = pickSignupRankRequirements(undefined);
    expect(result).toEqual({
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    });
  });

  it("returns requirements from season when all are true", () => {
    const season = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    } as SeasonDetails;
    const result = pickSignupRankRequirements(season);
    expect(result).toEqual({
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    });
  });

  it("returns requirements from season when all are false", () => {
    const season = {
      faceit_rank_required: false,
      premier_rank_required: false,
      hours_played_required: false
    } as SeasonDetails;
    const result = pickSignupRankRequirements(season);
    expect(result).toEqual({
      faceit_rank_required: false,
      premier_rank_required: false,
      hours_played_required: false
    });
  });

  it("returns requirements from season when mixed", () => {
    const season = {
      faceit_rank_required: true,
      premier_rank_required: false,
      hours_played_required: true
    } as SeasonDetails;
    const result = pickSignupRankRequirements(season);
    expect(result).toEqual({
      faceit_rank_required: true,
      premier_rank_required: false,
      hours_played_required: true
    });
  });
});

describe("playerMeetsSeasonRankAndHoursRequirements", () => {
  it("returns true when all requirements are met", () => {
    const player = {
      rank: 100,
      externalRank: 5,
      hours: 100
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(true);
  });

  it("returns false when rank is -1 and premier required", () => {
    const player = {
      rank: -1,
      externalRank: 5,
      hours: 100
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(false);
  });

  it("returns true when rank is -1 but premier not required", () => {
    const player = {
      rank: -1,
      externalRank: 5,
      hours: 100
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: false,
      hours_played_required: true
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(true);
  });

  it("returns false when externalRank is -1 and faceit required", () => {
    const player = {
      rank: 100,
      externalRank: -1,
      hours: 100
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true,
      platform: SeasonPlatform.FACEIT
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(false);
  });

  it("returns true when faceit required on Kanaliiga and external rank is missing", () => {
    const player = {
      rank: 100,
      externalRank: -1,
      hours: 100
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true,
      platform: SeasonPlatform.Kanaliiga
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(true);
  });

  it("returns false when hours is -1 and hours required", () => {
    const player = {
      rank: 100,
      externalRank: 5,
      hours: -1
    };
    const requirements = {
      faceit_rank_required: true,
      premier_rank_required: true,
      hours_played_required: true
    };
    expect(
      playerMeetsSeasonRankAndHoursRequirements(requirements, player)
    ).toBe(false);
  });

  it("returns true when season requirements are null", () => {
    const player = {
      rank: -1,
      externalRank: -1,
      hours: -1
    };
    expect(playerMeetsSeasonRankAndHoursRequirements(null, player)).toBe(true);
  });

  it("returns true when season requirements are undefined", () => {
    const player = {
      rank: -1,
      externalRank: -1,
      hours: -1
    };
    expect(playerMeetsSeasonRankAndHoursRequirements(undefined, player)).toBe(
      true
    );
  });
});
