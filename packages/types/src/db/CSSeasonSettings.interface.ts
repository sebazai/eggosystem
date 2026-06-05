export interface CSSeasonSettings {
  season_id: number;
  is_round_robin_bo2_as_2xbo1: boolean;
  grand_final_round_one_only: boolean;
  faceit_rank_required: boolean;
  premier_rank_required: boolean;
  hours_played_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CSSeasonSettingsInput {
  is_round_robin_bo2_as_2xbo1: boolean;
  faceit_rank_required: boolean;
  premier_rank_required: boolean;
  hours_played_required: boolean;
}

export const createMockCSSeasonSettings = (
  overrides?: Partial<CSSeasonSettings>
): CSSeasonSettings => ({
  season_id: 1,
  is_round_robin_bo2_as_2xbo1: false,
  grand_final_round_one_only: false,
  faceit_rank_required: false,
  premier_rank_required: false,
  hours_played_required: false,
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
  ...overrides
});
