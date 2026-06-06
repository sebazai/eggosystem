export interface SeasonSignupSettings {
  season_id: number;
  min_players: number;
  max_players: number;
}

export interface SeasonSignupSettingsInput {
  min_players: number;
  max_players: number;
}

export const createMockSeasonSignupSettings = (
  overrides?: Partial<SeasonSignupSettings>
): SeasonSignupSettings => ({
  season_id: 1,
  min_players: 5,
  max_players: 9,
  ...overrides
});
