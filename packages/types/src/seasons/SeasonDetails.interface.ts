import { Game, Season, SeasonPlatform } from "@eggosystem/types";

export interface SeasonDetails extends Season {
  app_id: Game["app_id"];
}

export const createMockSeasonDetails = (
  overrides?: Partial<SeasonDetails>
): SeasonDetails => {
  return {
    id: 1,
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Season 1",
    full_name: "Test Season 1",
    app_id: 730,
    signup_start_date: "2024-01-01T00:00:00Z",
    signup_end_date: "2024-01-31T23:59:59Z",
    start_date: "2024-02-01",
    end_date: "2024-03-31",
    platform: SeasonPlatform.FACEIT,
    is_round_robin_bo2_as_2xbo1: false,
    grand_final_round_one_only: false,
    payment_link: null,
    registration_price: null,
    has_vat: false,
    early_bird_price_discount: null,
    early_bird_price_discount_end_date: null,
    active_map_pool: [1, 2, 3],
    rulebook_url: null,
    discord_link: null,
    faceit_rank_required: false,
    premier_rank_required: false,
    hours_played_required: false,
    min_players: 5,
    max_players: 9,
    ...overrides
  } satisfies SeasonDetails;
};
