import { http, HttpResponse } from "msw";
import { ISteamUserResponse, e2eSteamPlayerData } from "@eggosystem/types";

export const getPlayerSummariesHandlers = [
  http.get(
    "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/**",
    ({ request }) => {
      const url = new URL(request.url);
      const steamids = url.searchParams.get("steamids");

      if (!steamids) {
        return new HttpResponse("Bad Request", { status: 400 });
      }

      // Parse the steamids parameter (can be comma-separated)
      const requestedSteamIds = steamids.split(",");

      // Create response players based on requested Steam IDs
      const players = requestedSteamIds.map((steamId) => {
        // Find the player in our e2e data
        const playerData = e2eSteamPlayerData.find(
          (p) => p.steam_id === steamId
        );

        if (playerData) {
          return {
            steamid: steamId,
            communityvisibilitystate: 3, // Public profile
            personaname: playerData.nickname,
            profileurl: `https://steamcommunity.com/profiles/${steamId}`,
            avatar: "https://avatars.steamstatic.com/avatar.jpg",
            avatarmedium: "https://avatars.steamstatic.com/avatar_medium.jpg",
            avatarfull: "https://avatars.steamstatic.com/avatar_full.jpg",
            personastate: 1,
            profilestate: 1,
            lastlogoff: Math.floor(Date.now() / 1000),
            commentpermission: 1
          };
        }

        // Default response for unknown Steam IDs
        return {
          steamid: steamId,
          communityvisibilitystate: 3,
          personaname: "Unknown Player",
          profileurl: `https://steamcommunity.com/profiles/${steamId}`,
          avatar: "https://avatars.steamstatic.com/avatar.jpg",
          avatarmedium: "https://avatars.steamstatic.com/avatar_medium.jpg",
          avatarfull: "https://avatars.steamstatic.com/avatar_full.jpg",
          personastate: 1,
          profilestate: 1,
          lastlogoff: Math.floor(Date.now() / 1000),
          commentpermission: 1
        };
      });

      return HttpResponse.json({
        response: {
          players: players
        }
      } satisfies ISteamUserResponse);
    }
  )
];
