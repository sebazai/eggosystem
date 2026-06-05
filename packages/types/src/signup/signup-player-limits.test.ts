import {
  baseSignupFormSchema,
  createMockSignupFormValues,
  signupFormSchema,
  signupFormSchemaContextFromSeason
} from "./index";
import { SeasonPlatform } from "../enums";
import { createMockSeasonDetails } from "../seasons/SeasonDetails.interface";

describe("signup player limits", () => {
  const context = {
    platform: SeasonPlatform.FACEIT,
    minPlayers: 3,
    maxPlayers: 4
  };

  it("accepts a roster within min and max bounds", () => {
    const data = {
      ...createMockSignupFormValues({
        teamExternalId: "facded66-34dd-4a81-8a58-4d59c8b391d5"
      }),
      players: createMockSignupFormValues().players.slice(0, 4)
    };
    expect(signupFormSchema(context).safeParse(data).success).toBe(true);
  });

  it("rejects rosters below min_players", () => {
    const data = createMockSignupFormValues({}, [
      { captain: true, discordLinked: true },
      { coCaptain: true, discordLinked: true }
    ]);
    expect(signupFormSchema(context).safeParse(data).success).toBe(false);
  });

  it("rejects rosters above max_players", () => {
    const data = createMockSignupFormValues();
    expect(signupFormSchema(context).safeParse(data).success).toBe(false);
  });

  it("builds schema context from season details", () => {
    const season = createMockSeasonDetails({
      min_players: 3,
      max_players: 4
    });
    expect(signupFormSchemaContextFromSeason(season)).toEqual({
      platform: season.platform,
      minPlayers: 3,
      maxPlayers: 4
    });
  });

  it("base schema enforces array bounds without org/team refinements", () => {
    const players = createMockSignupFormValues().players.slice(0, 2);
    const result = baseSignupFormSchema(context).safeParse({
      organizationId: 1,
      teamId: 1,
      teamExternalId: "facded66-34dd-4a81-8a58-4d59c8b391d5",
      captainHasReadTermAndConditions: true,
      players
    });
    expect(result.success).toBe(false);
  });
});
