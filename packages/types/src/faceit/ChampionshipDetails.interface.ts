interface ChampionshipJoinChecks {
  min_skill_level: number;
  max_skill_level: number;
  whitelist_geo_countries: string[];
  whitelist_geo_countries_min_players: number;
  blacklist_geo_countries: string[];
  join_policy: string;
  membership_type: string;
  allowed_team_types: string[];
}

interface ChampionshipSubstitutionConfiguration {
  max_substitutes: number;
  max_substitutions: number;
}

interface ChampionshipScheduleRound {
  date: number;
  status: string;
}

interface ChampionshipSchedule {
  [round: string]: ChampionshipScheduleRound;
}

interface ChampionshipStream {
  active: boolean;
  platform: string;
  source: string;
  title: string;
}

export interface ChampionshipDetails {
  id: string;
  championship_id: string;
  name: string;
  cover_image: string;
  background_image: string;
  avatar: string;
  organizer_id: string;
  description: string;
  type: string;
  status: string;
  game_id: string;
  region: string;
  featured: boolean;
  subscription_start: number;
  checkin_start: number;
  checkin_clear: number;
  subscription_end: number;
  championship_start: number;
  slots: number;
  current_subscriptions: number;
  join_checks: ChampionshipJoinChecks;
  anticheat_required: boolean;
  rules_id: string;
  substitution_configuration: ChampionshipSubstitutionConfiguration;
  full: boolean;
  checkin_enabled: boolean;
  total_rounds: number;
  schedule: ChampionshipSchedule;
  total_groups: number;
  subscriptions_locked: boolean;
  seeding_strategy: string;
  faceit_url: string;
  prizes: unknown | null;
  total_prizes: number;
  stream: ChampionshipStream;
}
