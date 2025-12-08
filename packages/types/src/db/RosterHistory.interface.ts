// Roster history types for importing roster from previous seasons

export interface RosterHistoryPlayer {
  steamId: string;
  nickname: string;
  isCaptain: boolean;
  isCoCaptain: boolean;
}

export interface RosterHistorySeason {
  seasonId: number;
  seasonName: string;
  players: RosterHistoryPlayer[];
}

export interface RosterHistoryResponse {
  seasons: RosterHistorySeason[];
}
