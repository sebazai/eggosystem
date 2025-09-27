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
  is_round_robin_bo2_as_2xbo1?: boolean
): Season => {
  return {
    id,
    game_id: game_id ?? 1,
    game_type_id: game_type_id ?? 1,
    name,
    full_name,
    signup_start_date,
    signup_end_date,
    platform: platform as SeasonPlatform,
    start_date,
    end_date: end_date ?? null,
    is_round_robin_bo2_as_2xbo1: is_round_robin_bo2_as_2xbo1 ?? false
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
  is_round_robin_bo2_as_2xbo1?: boolean
): InsertSeason => {
  return {
    id,
    game_id: game_id ?? 1,
    game_type_id: game_type_id ?? 1,
    name,
    full_name,
    signup_start_date: new Date(signup_start_date),
    signup_end_date: new Date(signup_end_date),
    platform: platform as SeasonPlatform,
    start_date: new Date(start_date),
    end_date: end_date ? new Date(end_date) : null,
    is_round_robin_bo2_as_2xbo1: is_round_robin_bo2_as_2xbo1 ?? false
  };
};
