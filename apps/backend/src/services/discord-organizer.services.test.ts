import {
  buildFlaggedMatchDiscordContent,
  notifyFlaggedMatchInDiscord
} from "./discord-organizer.services";
import type { FlaggedMatches } from "@eggosystem/types";

describe("discord-organizer.services", () => {
  describe("buildFlaggedMatchDiscordContent", () => {
    const baseUrl = "https://hub.example.com";

    it("includes match links and missing Steam ID for sample payload", () => {
      const payload: FlaggedMatches = {
        external_match_id: "1-7c6a4ebe-db57-47d6-a183-a4c1bd61ba7f",
        steam_ids: [
          "76561198113087101",
          "76561197987504632",
          "76561198003359251",
          "76561198054533809",
          "76561197963612504"
        ],
        players_in_season_team_players: [
          "76561198003359251",
          "76561198054533809",
          "76561197987504632",
          "76561198113087101"
        ],
        team_id: 1542,
        match_ids: [12717, 12718],
        players_added_for_this_match: []
      };

      const content = buildFlaggedMatchDiscordContent(payload, baseUrl);

      expect(content).toContain("**Flagged match**");
      expect(content).toContain("ban hammer");
      expect(content).toContain("Team ID 1542");
      expect(content).toContain("1-7c6a4ebe-db57-47d6-a183-a4c1bd61ba7f");
      expect(content).toContain(`${baseUrl}/matches/12717`);
      expect(content).toContain(`${baseUrl}/matches/12718`);
      expect(content).toContain("76561197963612504");
      expect(content).toContain(`${baseUrl}/dashboard/matches/flagged`);
    });

    it("shows — for match links when match_ids is empty", () => {
      const payload: FlaggedMatches = {
        external_match_id: "ext-1",
        team_id: 1,
        match_ids: []
      };

      const content = buildFlaggedMatchDiscordContent(payload, baseUrl);

      expect(content).toContain("**Match links:** —");
    });

    it("shows — (see dashboard for details) when no missing Steam IDs", () => {
      const payload: FlaggedMatches = {
        external_match_id: "ext-1",
        steam_ids: ["steam1"],
        players_in_season_team_players: ["steam1"],
        team_id: 1,
        match_ids: [10]
      };

      const content = buildFlaggedMatchDiscordContent(payload, baseUrl);

      expect(content).toContain(
        "**Player(s) not in season roster:** — (see dashboard for details)"
      );
    });
  });

  describe("notifyFlaggedMatchInDiscord", () => {
    it("is defined and callable", () => {
      expect(notifyFlaggedMatchInDiscord).toBeDefined();
      expect(typeof notifyFlaggedMatchInDiscord).toBe("function");
    });
  });
});
