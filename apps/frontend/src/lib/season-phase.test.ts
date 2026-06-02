import { getSeasonPhaseInfo } from "./season-phase";

describe("getSeasonPhaseInfo", () => {
  const baseSeason = {
    season_id: 17,
    full_name: "CS2 Season 5",
    platform: "faceit" as const,
    start_date: "2026-01-16",
    end_date: "2026-05-26",
    signup_start_date: "2025-12-21T16:00:00.000Z",
    signup_end_date: "2026-01-13T18:40:00.000Z"
  };

  it("returns live when the season is in progress", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");

    expect(getSeasonPhaseInfo(baseSeason, now)).toEqual({
      phase: "live",
      seasonNumber: "5",
      seasonName: "CS2 Season 5"
    });
  });

  it("returns signup when registration is open before the season starts", () => {
    const now = new Date("2026-01-05T12:00:00.000Z");

    expect(getSeasonPhaseInfo(baseSeason, now)).toEqual({
      phase: "signup",
      seasonNumber: "5",
      seasonName: "CS2 Season 5"
    });
  });

  it("returns concluded when the season has ended", () => {
    const now = new Date("2026-06-02T12:00:00.000Z");

    expect(getSeasonPhaseInfo(baseSeason, now)).toEqual({
      phase: "concluded",
      seasonNumber: "5",
      seasonName: "CS2 Season 5"
    });
  });

  it("returns concluded when no season data is available", () => {
    expect(getSeasonPhaseInfo(undefined)).toEqual({
      phase: "concluded",
      seasonNumber: null,
      seasonName: null
    });
  });

  it("returns concluded when season payload has no season_id (empty API body)", () => {
    expect(getSeasonPhaseInfo({} as typeof baseSeason)).toEqual({
      phase: "concluded",
      seasonNumber: null,
      seasonName: null
    });
  });
});
