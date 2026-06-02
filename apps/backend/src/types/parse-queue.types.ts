// Parse Queue Message Types

/**
 * Message format for parse_queue (HUB → Demo Parser)
 */
export interface ParseQueueMessage {
  match_game_id: string;
  download_url: string;
  priority: number;
  created_at: string;
  source: string;
  reparse: boolean;
}

/**
 * Message format for parse result queue (Demo Parser → HUB)
 */
export interface ParseResultMessage {
  match_game_id: string;
  demo_file: string;
  json_file: string;
  processed_at: string;
  processing_duration: number;
  worker_id: string;
  status: string;
  parsed_payload: ParsedPayload;
}

interface SpottedAccuracyPerEnemy {
  player_steam_id: string;
  victim_steam_id: string;
  shots_fired: number;
  shots_hit: number;
}

interface SpottedAccuracy {
  shots_hit: number;
  shots_fired: number;
  per_enemy: {
    [steam_id: string]: SpottedAccuracyPerEnemy;
  };
}

interface DemoScore {
  Team1HTScore: number;
  Team2HTScore: number;
  Team1Score: number;
  Team2Score: number;
  Team1OTScore: number;
  Team2OTScore: number;
  Map: string;
}

export interface DemoPlayer {
  Name: string;
  Kills: number;
  Kills_T: number;
  Kills_CT: number;
  Assists: number;
  Assists_CT: number;
  Assists_T: number;
  Deaths: number;
  Deaths_CT: number;
  Deaths_T: number;
  MVPs: number;
  HeadShots: number;
  HsPercent: number;
  TotalDamage: number;
  TotalDamage_T: number;
  TotalDamage_CT: number;
  FlashAssists: number;
  FlashAssists_CT: number;
  FlashAssists_T: number;
  FirstKillFlashAssists: number;
  FirstKillFlashAssists_CT: number;
  FirstKillFlashAssists_T: number;
  ADR: string | number;
  ADR_T: string | number;
  ADR_CT: string | number;
  SteamID: string;
  Team: number;
  FirstKills: number;
  FirstKills_CT: number;
  FirstKills_T: number;
  FirstDeaths: number;
  FirstDeaths_CT: number;
  FirstDeaths_T: number;
  Plants: number;
  Explodes: number;
  Defuses: number;
  Kills1: number;
  Kills2: number;
  Kills3: number;
  Kills4: number;
  Kills5: number;
  Trades: number;
  Trades_CT: number;
  Trades_T: number;
  Traded: number;
  Traded_CT: number;
  Traded_T: number;
  ClutchesWon: number;
  Clutches: number;
  UtilityDamage: number;
  UtilityDamage_CT: number;
  UtilityDamage_T: number;
  MolotovDamage: number;
  MolotovDamage_CT: number;
  MolotovDamage_T: number;
  HEDamage: number;
  HEDamage_CT: number;
  HEDamage_T: number;
  AWPKills: number;
  KillsThroughWalls: number;
  TradeAttempts: number;
  TradeAttempts_CT: number;
  TradeAttempts_T: number;
  FirstDeathTradeAttempts: number;
  FirstDeathTradeAttempts_CT: number;
  FirstDeathTradeAttempts_T: number;
  FirstDeathTradeOppoturnities: number;
  FirstDeathTradeOppoturnities_CT: number;
  FirstDeathTradeOppoturnities_T: number;
  TradeOppoturnities: number;
  TradeOppoturnities_CT: number;
  TradeOppoturnities_T: number;
  MatesFlashed: number; // enzoj master at this
  MatesFlashed_CT: number;
  MatesFlashed_T: number;
  EnemiesFlashed: number;
  EnemiesFlashed_T: number;
  EnemiesFlashed_CT: number;
  FirstDeath_Trades: number;
  FirstDeath_Trades_CT: number;
  FirstDeath_Trades_T: number;
  FirstDeath_Traded: number;
  FirstDeath_Traded_CT: number;
  FirstDeath_Traded_T: number;
  TotalEFDuration: string | number;
  TotalEFDuration_CT: string | number;
  TotalEFDuration_T: string | number;
  TotalMFDuration: string | number;
  TotalMFDuration_CT: string | number;
  TotalMFDuration_T: string | number;
  OneVOneLost: number;
  OneVOneWon: number;
  KAST: number;
  SelfFlashes: number;
  FlashesThrown: number;
  FlashesThrown_CT: number;
  FlashesThrown_T: number;
  TTF: number;
  OneVOneLost_CT: number;
  OneVOneWon_CT: number;
  OneVOneLost_T: number;
  OneVOneWon_T: number;
  TTD: number;
  CrosshairPlacement: number;
  RWS: number;
  TotalStrafingShots: number;
  GoodStrafingShots: number;
  Shots: number;
  ShotsHit: number;
  SpottedAccuracy: SpottedAccuracy;
  KanaRating: string | number;
  WeaponClassStats: unknown;
}

interface DemoPlayers {
  [steam_id: string]: DemoPlayer;
}

interface DemoTradeRoundInfo {
  Traded: boolean;
  RoundNumber: number;
  FirstDeath: boolean;
  Victim: string; // steam_id
  Trader: string; // steam_id
  Killer: string; // steam_id
  Attempted: boolean;
  Time: number;
  TradeTime: number;
  DeathTime: number;
  TradeDenied?: boolean;
  TradeTimeout?: boolean;
  DenialTime?: number;
  TradeWindow?: number;
}

export interface DemoTrades {
  [steam_id: string]: Record<number, DemoTradeRoundInfo[]>;
}

interface DemoClutchRoundInfo {
  RoundNumber: number;
  PlayerTeam: string; // T or CT
  Won: boolean;
  ClutchStartEnemies: number;
  SteamID: string;
  Kills: number;
  EndInfo: string; // Won or Lost
}

export interface DemoClutches {
  Infos: DemoClutchRoundInfo[];
}

interface DemoBombplant {
  Site: string; // A or B or ""
  Alive: {
    T: string[] | null; // Array of steam_ids
    CT: string[] | null; // Array of steam_ids
  };
}
interface DemoRoundInfo {
  Bombplant: DemoBombplant;
  CTAvgBank: number;
  CTBuyStrategy: string;
  CTBuyType: string;
  CTEndBank: number;
  CTEndEqValue: number;
  CTEquipmentValue: number;
  CTPreBuyBank: number;
  CTPreBuyEqValue: number;
  CTTotalBank: number;
  CT_Team: number;
  FirstKill: string; // CT or T
  Importance: number;
  RoundEndInfo: number;
  RoundNumber: number;
  RoundType: string;
  TAvgBank: number;
  TBuyStrategy: string;
  TBuyType: string;
  TEndBank: number;
  TEndEqValue: number;
  TEquipmentValue: number;
  TPreBuyBank: number;
  TPreBuyEqValue: number;
  TTotalBank: number;
  T_Team: number;
  Winner: string; // CT or T
}

interface DemoNewRoundInfo {
  Rounds: DemoRoundInfo[];
}

export interface DemoRoundImpact {
  RoundNumber: number;
  SteamID: string | number;
  Kills: number;
  Assists: number;
  FirstKill: boolean;
  Trades: number;
  ADR: number;
  FlashAssists: number;
  FirstKillFlashAssists: number;
  ImpactScore: string | number;
  EntryKill: boolean;
  ExitKill: boolean;
  BombPlanted: boolean;
  BombDefused: boolean;
  BombExploded: boolean;
  KillOpponentValue: string | number;
  WinProbImpact: string | number;
  TradeDenials?: number;
  FailedTrades?: number;
  TradeEfficiency?: number;
}

/**
 * Kill event from the demo parser.
 * Fields added in KanaRating 3.2 are optional for backward compatibility
 * with older parser output that does not include them.
 */
export interface KillEvent {
  round_number: number;
  time_in_round: number; // Seconds since round start
  killer: number; // Steam ID as number (uint64 in Go)
  killer_team: "CT" | "T";
  victim: number; // Steam ID as number
  victim_team: "CT" | "T";
  weapon: string;
  is_headshot: boolean;
  is_penetration: boolean; // Wall-bang
  is_first_kill: boolean;
  cts_alive_after: number; // After this kill
  ts_alive_after: number; // After this kill
  bomb_planted: boolean; // Was bomb planted at time of kill
  assister: number; // Steam ID (0 = no assister)
  is_flash_assist: boolean;
  // KanaRating 3.2 enrichment fields (optional — absent on old parser output)
  is_first_death?: boolean;
  is_exit_kill?: boolean;
  is_post_plant?: boolean;
  was_victim_traded?: boolean;
  ct_buy_type?: string;
  t_buy_type?: string;
  /** Steam ID of the player whose flash enabled this kill. Parser emits 0 for "none". */
  setup_flash_thrower?: number;
  /** Steam ID of the player whose utility damage set up this kill. Parser emits 0 for "none". */
  setup_damage_player?: number;
  victim_blind_seconds?: number;
}

// ── KanaRating 3.2 event log interfaces ──────────────────────────────────────

/** @public */
export interface FlashEvent {
  round_number: number;
  time_in_round: number;
  thrower: number; // Steam ID
  thrower_team: "CT" | "T";
  victim: number; // Steam ID
  victim_team: "CT" | "T";
  duration_seconds: number;
  // Accepted from parser for backward compat; no longer persisted in DB (VIRTUAL GENERATED)
  is_self_flash?: boolean;
  is_teammate_flash?: boolean;
  is_enemy_flash?: boolean;
}

/** @public */
export interface SwingContributor {
  steam_id: number;
  contribution: number; // Share of delta (0–1)
}

/** @public */
export interface RoundSwingEvent {
  round_number: number;
  time_in_round: number;
  event_type: string; // "kill" | "plant" | "defuse"
  pre_win_prob: number; // CT win probability before event
  post_win_prob: number;
  delta: number; // Signed change; positive = CT favoured
  primary_player: number; // Steam ID of killer / actor
  contributors: SwingContributor[];
}

/** @public */
export interface SetupEvent {
  round_number: number;
  time_in_round: number;
  setup_type: "flash" | "utility_damage";
  setup_player: number; // Steam ID
  beneficiary: number; // Steam ID
  victim: number; // Steam ID
  seconds_after_setup: number;
  flash_duration?: number;
  damage_dealt?: number;
}

/** @public */
export interface WastedUtilityEvent {
  round_number: number;
  time_in_round: number;
  thrower: number; // Steam ID
  utility_type: string; // "HE" | "Molotov" | "Incendiary"
}

/** @public */
export interface HitEvent {
  round_number: number;
  time_in_round: number; // Seconds since round start
  attacker: number; // SteamID64 as number; equals victim for self-damage
  attacker_team: "CT" | "T";
  victim: number; // SteamID64 as number
  victim_team: "CT" | "T";
  weapon: string;
  hit_group: string; // head | chest | stomach | left_arm | right_arm | left_leg | right_leg | neck | gear | generic
  health_damage: number; // Capped HP damage (no over-damage)
  armor_damage: number; // Capped armor damage
  health_remaining: number; // Victim HP after hit; 0 on kill
  is_kill_hit: boolean; // True for the shot that killed the victim
}

/** @public */
export interface RoundUtilitySummaryEntry {
  round_number: number;
  steam_id: number;
  flashes_thrown: number;
  smokes_thrown: number;
  utility_damage: number;
  // Accepted from parser for backward compat; no longer persisted in DB
  enemies_flashed?: number;
  teammates_flashed?: number;
  wasted_utility?: number;
}

/** @public */
export interface ParsedPayloadMeta {
  parser_version?: string;
  match_game_id?: string;
  map?: string;
  total_rounds?: number;
  parsed_at?: string;
}

export interface ParsedPayload {
  Score: DemoScore;
  Players: DemoPlayers;
  Trades: DemoTrades;
  Clutches: DemoClutches;
  RoundInfo: number[];
  NewRoundInfo: DemoNewRoundInfo;
  RoundImpacts: DemoRoundImpact[];
  KillLog?: KillEvent[];
  HitLog?: HitEvent[];
  // KanaRating 3.2 event logs (absent on old parser output — always treat as optional)
  Meta?: ParsedPayloadMeta;
  FlashLog?: FlashEvent[];
  RoundSwingLog?: RoundSwingEvent[];
  SetupEventLog?: SetupEvent[];
  WastedUtilityLog?: WastedUtilityEvent[];
  RoundUtilitySummary?: RoundUtilitySummaryEntry[];
}
