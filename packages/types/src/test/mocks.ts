import { InsertSeason, Season } from "../db";
import { SeasonPlatform } from "../enums";

export const createMockSeason = (
  id: number,
  name: string,
  full_name: string,
  signup_start_date: string,
  signup_end_date: string,
  platform: string,
  start_date: string,
  end_date?: string | null,
  game_id?: number,
  game_type_id?: number,
  organizer_id?: number,
  is_round_robin_bo2_as_2xbo1?: boolean,
  grand_final_round_one_only?: boolean,
  payment_link?: string | null,
  registration_price?: number | null,
  has_vat?: boolean,
  early_bird_price_discount?: number | null,
  early_bird_price_discount_end_date?: string | null
): Season => {
  return {
    id,
    game_id: game_id ?? 1,
    game_type_id: game_type_id ?? 1,
    organizer_id: organizer_id ?? 1,
    name,
    full_name,
    signup_start_date,
    signup_end_date,
    platform: platform as SeasonPlatform,
    start_date,
    end_date: end_date ?? null,
    is_round_robin_bo2_as_2xbo1: is_round_robin_bo2_as_2xbo1 ?? false,
    grand_final_round_one_only: grand_final_round_one_only ?? false,
    payment_link: payment_link ?? null,
    registration_price: registration_price ?? null,
    has_vat: has_vat ?? true,
    early_bird_price_discount: early_bird_price_discount ?? null,
    early_bird_price_discount_end_date:
      early_bird_price_discount_end_date ?? null
  };
};

export const createMockInsertSeason = (
  id: number,
  name: string,
  full_name: string,
  signup_start_date: string,
  signup_end_date: string,
  platform: string,
  start_date: string,
  end_date?: string | null,
  game_id?: number,
  game_type_id?: number,
  organizer_id?: number,
  is_round_robin_bo2_as_2xbo1?: boolean,
  registration_price?: number | null,
  has_vat?: boolean
): InsertSeason => {
  return {
    id,
    game_id: game_id ?? 1,
    game_type_id: game_type_id ?? 1,
    organizer_id: organizer_id ?? 1,
    name,
    full_name,
    signup_start_date: new Date(signup_start_date),
    signup_end_date: new Date(signup_end_date),
    platform: platform as SeasonPlatform,
    start_date: new Date(start_date),
    end_date: end_date ? new Date(end_date) : null,
    is_round_robin_bo2_as_2xbo1: is_round_robin_bo2_as_2xbo1 ?? false,
    registration_price: registration_price ?? null,
    has_vat: has_vat ?? true
  };
};
