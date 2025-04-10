interface FaceITTeamMember {
  user_id: string;
  nickname: string;
  avatar: string;
  country: string;
  faceit_url: string;
}

export interface FaceITTeamDetails {
  team_id: string;
  nickname: string;
  name: string;
  avatar: string;
  game: "cs2" | "csgo";
  team_type: string;
  members: FaceITTeamMember[];
  leader: string;
  chat_room_id: string;
  faceit_url: string;
}
