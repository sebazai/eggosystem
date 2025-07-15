export interface MatchEntity {
  id: string;
  name: string;
  type: string;
}

export interface MatchTeam {
  id: string;
  name: string;
  type: string;
  avatar: string;
  leader_id: string;
  co_leader_id: string;
  roster: TeamPlayer[];
  substitutions: number;
  substitutes: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  nickname: string;
  avatar: string;
  game_id: string;
  game_name: string;
  game_skill_level: number;
  membership: string;
  anticheat_required: boolean;
}
