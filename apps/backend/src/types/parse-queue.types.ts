// Parse Queue Message Types

/**
 * Message format for parse_queue (HUB → Demo Parser)
 */
export interface ParseQueueMessage {
  game_id: string;
  download_url: string;
  priority: number;
  created_at: string;
  source: string;
}

/**
 * Status types for parsing results
 */
export type ParsingStatus = "success" | "partial_success" | "failed";

/**
 * Message format for parse result queue (Demo Parser → HUB)
 */
export interface ParseResultMessage {
  game_id: string;
  demo_file: string;
  json_file: string;
  processed_at: string;
  processing_duration: number;
  worker_id: string;
  status: ParsingStatus;
  parsed_payload: ParsedPayload; // You'll implement this type
}

interface SpottedAccuracyPerEnemy {
  player_steam_id: number;
  victim_steam_id: number;
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
  ADR: number;
  ADR_T: number;
  ADR_CT: number;
  SteamID: number;
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
  TotalEFDuration: number;
  TotalEFDuration_CT: number;
  TotalEFDuration_T: number;
  TotalMFDuration: number;
  TotalMFDuration_CT: number;
  TotalMFDuration_T: number;
  OneVOneLost: number;
  OneVOneWon: number;
  KAST: number;
  SelfFlashes: number;
  FlashesThrown: number;
  FlashesThrown_CT: number;
  FlashesThrown_T: number;
  TTD: number;
  CrosshairPlacement: number;
  RWS: number;
  TotalStrafingShots: number;
  GoodStrafingShots: number;
  Shots: number;
  ShotsHit: number;
  SpottedAccuracy: SpottedAccuracy;
  KanaRating: number;
  WeaponClassStats: unknown;
}

interface DemoPlayers {
  [steam_id: string]: DemoPlayer;
}

interface DemoTradeRoundInfo {
  Traded: boolean;
  RoundNumber: number;
  FirstDeath: boolean;
  Victim: number; // steam_id
  Trader: number; // steam_id
  Killer: number; // steam_id
  Attempted: boolean;
  Time: number;
  TradeTime: number;
  DeathTime: number;
}

interface DemoTrades {
  [steam_id: string]: Record<number, DemoTradeRoundInfo[]>;
}

interface DemoClutchRoundInfo {
  RoundNumber: number;
  PlayerTeam: string; // T or CT
  Won: boolean;
  ClutchStartEnemies: number;
  SteamID: number;
  Kills: number;
  EndInfo: string; // Won or Lost
}

interface DemoClutches {
  Infos: DemoClutchRoundInfo[];
}

interface DemoBombplant {
  Site: string; // A or B
  Alive: {
    T: number[] | null; // Array of steam_ids
    CT: number[] | null; // Array of steam_ids
  };
}
interface DemoRoundInfo {
  RoundNumber: number;
  CT_Team: number;
  T_Team: number;
  Winner: string;
  RoundEndInfo: number;
  FirstKill: string; // CT or T
  Bombplant: DemoBombplant;
  CTBuyType: string;
  TBuyType: string;
  RoundType: string;
  CTEquipmentValue: number;
  TEquipmentValue: number;
  CTAvgBank: number;
  TAvgBank: number;
  CTTotalBank: number;
  TTotalBank: number;
  Importance: number;
  CTPreBuyBank: number;
  TPreBuyBank: number;
  CTPreBuyEqValue: number;
  TPreBuyEqValue: number;
  CTEndBank: number;
  TEndBank: number;
  CTEndEqValue: number;
  TEndEqValue: number;
  CTBuyStrategy: string;
  TBuyStrategy: string;
}

interface DemoNewRoundInfo {
  Rounds: DemoRoundInfo[];
}

interface DemoRoundImpacts {
  RoundNumber: number;
  SteamID: number;
  Kills: number;
  Assists: number;
  FirstKill: boolean;
  Trades: number;
  ADR: number;
  FlashAssists: number;
  FirstKillFlashAssists: number;
  ImpactScore: number;
  EntryKill: boolean;
  ExitKill: boolean;
  BombPlanted: boolean;
  BombDefused: boolean;
  BombExploded: boolean;
  KillOpponentValue: number;
  WinProbImpact: number;
}

/**
 * Parsed payload type - to be implemented by you
 */
export interface ParsedPayload {
  Score: DemoScore;
  Players: DemoPlayers;
  RoundInfo: number[];
  Trades: DemoTrades;
  Clutches: DemoClutches;
  NewRoundInfo: DemoNewRoundInfo;
  RoundImpacts: DemoRoundImpacts[];
}

/**
 * Parse queue configuration
 */
export interface ParseQueueConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  parseQueueName: string;
  resultQueueName: string;
  errorQueueName: string;
  prefetchCount: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Default parse queue configuration
 */
export const DEFAULT_PARSE_QUEUE_CONFIG: ParseQueueConfig = {
  host: "eggo-rabbitmq",
  port: 5672,
  username: "test",
  password: "test",
  parseQueueName: "parse_queue",
  resultQueueName: "parse_result_queue",
  errorQueueName: "parse_error_queue",
  prefetchCount: 10,
  retryAttempts: 3,
  retryDelay: 5000
};
