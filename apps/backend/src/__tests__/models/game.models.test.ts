import type { GameTeamRoundBreakdown } from "@eggosystem/types";
import { getGameTeamRoundBreakdown } from "../../models/game.models";

describe("getGameTeamRoundBreakdown", () => {
  it("should return correct round breakdown for both teams in a 13-0 game", async () => {
    const gameId = 104220;
    const result = await getGameTeamRoundBreakdown(gameId);

    expect(result).toHaveLength(2);

    // Find the winning team (13-0)
    const winningTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 13
    );
    expect(winningTeam).toBeDefined();
    expect(winningTeam).toMatchObject({
      team_id: 1304,
      starting_side: "CT",
      rounds_won_first_half: 12,
      rounds_won_second_half: 1,
      total_rounds_won: 13,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });

    // Find the losing team (0-13)
    const losingTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 0
    );
    expect(losingTeam).toBeDefined();
    expect(losingTeam).toMatchObject({
      team_id: 13,
      starting_side: "T",
      rounds_won_first_half: 0,
      rounds_won_second_half: 0,
      total_rounds_won: 0,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });
  });

  it("should return correct round breakdown for both teams in another 13-0 game", async () => {
    const gameId = 103586;
    const result = await getGameTeamRoundBreakdown(gameId);

    expect(result).toHaveLength(2);

    // Find the winning team (13-0)
    const winningTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 13
    );
    expect(winningTeam).toBeDefined();
    expect(winningTeam).toMatchObject({
      team_id: 1254,
      starting_side: "T",
      rounds_won_first_half: 12,
      rounds_won_second_half: 1,
      total_rounds_won: 13,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });

    // Find the losing team (0-13)
    const losingTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 0
    );
    expect(losingTeam).toBeDefined();
    expect(losingTeam).toMatchObject({
      team_id: 1306,
      starting_side: "CT",
      rounds_won_first_half: 0,
      rounds_won_second_half: 0,
      total_rounds_won: 0,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });
  });

  it("should return correct round breakdown for both teams in a 13-6 game", async () => {
    const gameId = 104224;
    const result = await getGameTeamRoundBreakdown(gameId);

    expect(result).toHaveLength(2);

    // Find the winning team (13-6)
    const winningTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 13
    );
    expect(winningTeam).toBeDefined();
    expect(winningTeam).toMatchObject({
      team_id: 1991,
      starting_side: "CT",
      rounds_won_first_half: 7,
      rounds_won_second_half: 6,
      total_rounds_won: 13,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });

    // Find the losing team (6-13)
    const losingTeam = result.find(
      (team: GameTeamRoundBreakdown) => team.total_rounds_won === 6
    );
    expect(losingTeam).toBeDefined();
    expect(losingTeam).toMatchObject({
      team_id: 2115,
      starting_side: "T",
      rounds_won_first_half: 5,
      rounds_won_second_half: 1,
      total_rounds_won: 6,
      total_overtime_rounds_won: 0,
      overtime_rounds_won_ct: 0,
      overtime_rounds_won_t: 0
    });
  });
});
