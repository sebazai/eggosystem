interface FaceitPlayer {
  user_id: string;
  nickname: string;
  avatar?: string;
  country: string;
  skill_level: number;
  faceit_url: string;
}

interface FaceitTeam {
  team_id: string;
  name: string;
  team_type: string;
  members: FaceitPlayer[];
  leader: string;
  chat_room_id: string;
  faceit_url: string;
}

export interface ChampionshipSubscriptionItem {
  leader: string;
  coleader: string;
  team: FaceitTeam;
  group: number;
  substitutes: string[];
  roster: string[];
  status: string;
}

export interface ChampionshipSubscription {
  items: ChampionshipSubscriptionItem[];
  start: number;
  end: number;
}
