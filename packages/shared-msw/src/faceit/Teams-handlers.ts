import { FaceITTeamDetails } from "@eggosystem/types";
import { http, HttpResponse } from "msw";

export const faceitTeamHandlers = [
  http.get<{ faceit_team_id: string }>(
    "https://open.faceit.com/data/v4/teams/:faceit_team_id",
    ({ params }) => {
      const { faceit_team_id } = params;

      return HttpResponse.json({
        team_id: faceit_team_id,
        nickname: "Test Team",
        name: "Test Team",
        avatar: "https://example.com/avatar.png",
        game: "cs2",
        team_type: "premade",
        members: [],
        leader: "",
        chat_room_id: "",
        faceit_url: `https://www.faceit.com/en/teams/${faceit_team_id}`
      } as FaceITTeamDetails);
    }
  )
];
