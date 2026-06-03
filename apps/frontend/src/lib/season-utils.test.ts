import type { Season } from "@eggosystem/types";
import {
  formatSeasonDisplayLabel,
  getPastCs2Seasons,
  getSeasonPageLinks,
  isPastSeason
} from "./season-utils";

describe("season-utils", () => {
  const createSeason = (overrides: Partial<Season> = {}): Season =>
    ({
      id: 16,
      game_id: 1,
      organizer_id: 1,
      name: "S16",
      full_name: "Season 16",
      signup_start_date: null,
      signup_end_date: null,
      platform: "kanaliiga",
      start_date: "2025-01-01",
      end_date: "2025-04-30",
      is_round_robin_bo2_as_2xbo1: false,
      grand_final_round_one_only: false,
      payment_link: null,
      registration_price: null,
      has_vat: false,
      early_bird_price_discount: null,
      early_bird_price_discount_end_date: null,
      active_map_pool: [1],
      rulebook_url: null,
      discord_link: null,
      faceit_rank_required: false,
      premier_rank_required: false,
      hours_played_required: false,
      game_type_id: 1,
      ...overrides
    }) as Season;

  it("uses the season full name for display labels", () => {
    expect(formatSeasonDisplayLabel("CS:GO Season 11")).toBe("CS:GO Season 11");
    expect(formatSeasonDisplayLabel("CS2 Season 5")).toBe("CS2 Season 5");
    expect(formatSeasonDisplayLabel("  ")).toBe("Season");
  });

  it("includes the external schedule link in season page links", () => {
    const links = getSeasonPageLinks(11);
    const scheduleLink = links.find((link) => link.title === "Schedule");

    expect(scheduleLink).toEqual({
      title: "Schedule",
      href: "https://kanaliiga.fi/pelit/counter-strike-2",
      isExternal: true
    });
  });

  it("returns only past CS2 seasons sorted by newest first", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    const seasons = [
      createSeason({
        id: 18,
        full_name: "CS2 Season 5",
        end_date: "2026-11-30",
        start_date: "2026-05-01"
      }),
      createSeason({
        id: 17,
        full_name: "CS2 Season 4",
        end_date: "2026-03-31",
        start_date: "2025-11-01"
      }),
      createSeason({
        id: 11,
        full_name: "CS:GO Season 11",
        end_date: "2023-05-15",
        start_date: "2023-01-30"
      }),
      createSeason({
        id: 99,
        game_id: 4,
        full_name: "Dota Season 1",
        end_date: "2025-04-30"
      })
    ];

    expect(isPastSeason(seasons[2]!, now)).toBe(true);
    expect(getPastCs2Seasons(seasons, now).map((season) => season.id)).toEqual([
      17, 11
    ]);
  });
});
