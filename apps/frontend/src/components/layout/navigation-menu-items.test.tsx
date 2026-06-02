import { SeasonPlatform } from "@eggosystem/types";
import {
  getDefaultMenuItems,
  getRegisterCta,
  getSeasonMenuItem
} from "./navigation-menu-items";

describe("navigation-menu-items", () => {
  it("returns three top-level menu items", () => {
    const { menu } = getDefaultMenuItems();

    expect(menu.map((item) => item.title)).toEqual([
      "Community",
      "Season",
      "Stats"
    ]);
  });

  it("places community browse links under Community", () => {
    const { menu } = getDefaultMenuItems();
    const community = menu[0]?.items?.map((item) => item.title);

    expect(community).toEqual([
      "Organizations",
      "Kanahautomo",
      "Browse Teams",
      "Browse Players"
    ]);
  });

  it("places match history and season results under Stats", () => {
    const { menu } = getDefaultMenuItems();
    const stats = menu[2]?.items?.map((item) => item.title);

    expect(stats).toEqual([
      "Match History",
      "Player Leaderboards",
      "Kana Leaderboard",
      "Top Teams",
      "Hall of Fame",
      "Season Results"
    ]);
  });

  it("uses the season full name for a live season", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const liveSeason = {
      season_id: 17,
      platform: SeasonPlatform.Kanaliiga,
      full_name: "CS2 Season 5",
      signup_start_date: "2026-05-01",
      signup_end_date: "2026-06-01",
      start_date: "2026-05-15",
      end_date: "2026-11-30"
    };

    const seasonMenu = getSeasonMenuItem(liveSeason);

    expect(seasonMenu.title).toBe("CS2 Season 5");
    expect(seasonMenu.items?.map((item) => item.title)).toEqual(
      expect.arrayContaining(["Standings", "Past Seasons", "Schedule"])
    );
    expect(seasonMenu.items?.map((item) => item.title)).not.toContain(
      "Match History"
    );
    expect(seasonMenu.items?.map((item) => item.title)).not.toContain(
      "Season Results"
    );

    jest.useRealTimers();
  });

  it("links to past seasons when no active season is available", () => {
    const seasonMenu = getSeasonMenuItem();

    expect(seasonMenu.title).toBe("Season");
    expect(seasonMenu.items?.map((item) => item.title)).toEqual([
      "Past Seasons"
    ]);
  });

  it("returns register CTA during signup period", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const signupSeason = {
      season_id: 17,
      platform: SeasonPlatform.Kanaliiga,
      full_name: "CS2 Season 5",
      signup_start_date: "2026-05-01",
      signup_end_date: "2026-07-01",
      start_date: "2026-08-01",
      end_date: "2026-11-30"
    };

    expect(getRegisterCta(signupSeason)).toEqual({
      title: "Register CS2 S5",
      url: "/seasons/17/signup"
    });

    jest.useRealTimers();
  });
});
