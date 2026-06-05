import {
  DEFAULT_SIGNUP_PLAYER_LIMITS_BY_GAME_TYPE_ID,
  getDefaultSignupPlayerLimitsForGameTypeId
} from "./game-type-signup-defaults";

describe("getDefaultSignupPlayerLimitsForGameTypeId", () => {
  it("returns CS2 Comp limits for game type 1", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(1)).toEqual({
      min_players: 5,
      max_players: 9
    });
  });

  it("returns CS2 Wingman limits for game type 2", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(2)).toEqual({
      min_players: 2,
      max_players: 3
    });
  });

  it("returns PUBG Duo limits for game type 3", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(3)).toEqual({
      min_players: 2,
      max_players: 3
    });
  });

  it("returns PUBG Squad limits for game type 4", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(4)).toEqual({
      min_players: 3,
      max_players: 10
    });
  });

  it("returns Rocket League Standard limits for game type 5", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(5)).toEqual({
      min_players: 3,
      max_players: 5
    });
  });

  it("returns Dota Team Clash limits for game type 6", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(6)).toEqual({
      min_players: 5,
      max_players: 7
    });
  });

  it("returns fallback limits for an unknown game type ID", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(7)).toEqual({
      min_players: 5,
      max_players: 9
    });
  });

  it("returns fallback limits for a large unknown ID", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(9999)).toEqual({
      min_players: 5,
      max_players: 9
    });
  });

  it("returns fallback limits for ID 0", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(0)).toEqual({
      min_players: 5,
      max_players: 9
    });
  });

  it("returns fallback limits for a negative ID", () => {
    expect(getDefaultSignupPlayerLimitsForGameTypeId(-1)).toEqual({
      min_players: 5,
      max_players: 9
    });
  });

  it("covers all known IDs in DEFAULT_SIGNUP_PLAYER_LIMITS_BY_GAME_TYPE_ID", () => {
    for (const [id, limits] of Object.entries(
      DEFAULT_SIGNUP_PLAYER_LIMITS_BY_GAME_TYPE_ID
    )) {
      expect(getDefaultSignupPlayerLimitsForGameTypeId(Number(id))).toEqual(
        limits
      );
    }
  });
});
