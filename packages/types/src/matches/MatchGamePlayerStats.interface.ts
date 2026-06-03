/**
 * Per-player, per-match-game stat shapes.
 *
 * These describe the JSON contract for the match-game stat endpoints
 * (`/api/v1/match-games/:id/weapon-stats`, `/hit-stats`, `/round-events`,
 * `/utility-stats`). Shared between the backend models that build them and
 * the frontend hooks that consume them.
 */

// ── Weapon stats ─────────────────────────────────────────────────────────────

export interface WeaponStat {
  weapon: string;
  kills: number;
  headshot_kills: number;
  total_damage: number;
  hits: number;
}

// ── Hit-location stats ───────────────────────────────────────────────────────

export interface HitGroupCount {
  hit_group: string;
  hits: number;
  damage: number;
}

export interface HitStats {
  dealt: HitGroupCount[];
  received: HitGroupCount[];
}

// ── Per-round events ─────────────────────────────────────────────────────────

export interface RoundKillEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  weapon: string;
  is_headshot: boolean;
}

export interface RoundDeathEvent {
  round_number: number;
  time_in_round: number;
  killer_nickname: string;
  weapon: string;
  is_headshot: boolean;
}

export interface RoundFlashEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  duration_seconds: number;
  is_enemy_flash: boolean;
}

export interface RoundUtilityEvent {
  round_number: number;
  utility_damage: number;
  smokes_thrown: number;
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
}

export interface RoundWastedUtilityEvent {
  round_number: number;
  time_in_round: number;
  utility_type: string;
}

export interface RoundUtilityThrowEvent {
  round_number: number;
  time_in_round: number;
  utility_type: string;
}

export interface RoundUtilityDamageEvent {
  round_number: number;
  time_in_round: number;
  victim_nickname: string;
  weapon: string;
  health_damage: number;
  is_enemy_hit: boolean;
}

export interface PlayerRoundEvents {
  kills: RoundKillEvent[];
  deaths: RoundDeathEvent[];
  flashes: RoundFlashEvent[];
  utility: RoundUtilityEvent[];
  wasted: RoundWastedUtilityEvent[];
  utility_throws: RoundUtilityThrowEvent[];
  utility_damage_hits: RoundUtilityDamageEvent[];
}

// ── Aggregate utility stats ──────────────────────────────────────────────────

export interface PlayerGameUtilityStats {
  flashes_thrown: number;
  enemies_flashed: number;
  teammates_flashed: number;
  smokes_thrown: number;
  utility_damage: number;
  wasted_utility: number;
}
