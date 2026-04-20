import { getAllFaceITChampionshipSubscriptions } from "./faceit-championship.services";

describe("getAllFaceITChampionshipSubscriptions", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return all subscriptions when they fit in a single page", async () => {
    const mockSubscriptions = {
      items: [
        {
          leader: "player1_id",
          coleader: "player2_id",
          team: {
            team_id: "team1",
            name: "Team Alpha",
            team_type: "premade",
            members: [],
            leader: "player1_id",
            chat_room_id: "chat1",
            faceit_url: "https://faceit.com/team1"
          },
          group: 1,
          substitutes: [],
          roster: ["player1_id", "player2_id"],
          status: "registered"
        },
        {
          leader: "player3_id",
          coleader: "player4_id",
          team: {
            team_id: "team2",
            name: "Team Beta",
            team_type: "premade",
            members: [],
            leader: "player3_id",
            chat_room_id: "chat2",
            faceit_url: "https://faceit.com/team2"
          },
          group: 1,
          substitutes: [],
          roster: ["player3_id", "player4_id"],
          status: "registered"
        }
      ],
      start: 0,
      end: 2
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubscriptions
    });

    const result =
      await getAllFaceITChampionshipSubscriptions("test-championship");

    expect(result).toEqual(mockSubscriptions);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=0&limit=10",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        })
      })
    );
  });

  it("should combine multiple pages of subscriptions", async () => {
    const firstPageMock = {
      items: Array(10)
        .fill(null)
        .map((_, i) => ({
          leader: `player${i}_id`,
          coleader: `player${i + 1}_id`,
          team: {
            team_id: `team${i}`,
            name: `Team ${i}`,
            team_type: "premade",
            members: [],
            leader: `player${i}_id`,
            chat_room_id: `chat${i}`,
            faceit_url: `https://faceit.com/team${i}`
          },
          group: 1,
          substitutes: [],
          roster: [`player${i}_id`, `player${i + 1}_id`],
          status: "registered"
        })),
      start: 0,
      end: 10,
      other_field: "test_data"
    };

    const secondPageMock = {
      items: Array(5)
        .fill(null)
        .map((_, i) => ({
          leader: `player${i + 10}_id`,
          coleader: `player${i + 11}_id`,
          team: {
            team_id: `team${i + 10}`,
            name: `Team ${i + 10}`,
            team_type: "premade",
            members: [],
            leader: `player${i + 10}_id`,
            chat_room_id: `chat${i + 10}`,
            faceit_url: `https://faceit.com/team${i + 10}`
          },
          group: 1,
          substitutes: [],
          roster: [`player${i + 10}_id`, `player${i + 11}_id`],
          status: "registered"
        })),
      start: 10,
      end: 15
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstPageMock
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondPageMock
      });

    const result =
      await getAllFaceITChampionshipSubscriptions("test-championship");

    expect(result).toEqual({
      ...firstPageMock,
      items: [...firstPageMock.items, ...secondPageMock.items],
      start: 0,
      end: 15
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=0&limit=10",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        })
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://open.faceit.com/data/v4/championships/test-championship/subscriptions?offset=10&limit=10",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
        })
      })
    );
  });

  it("should handle empty subscriptions", async () => {
    const emptyMock = {
      items: [],
      start: 0,
      end: 0
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyMock
    });

    const result =
      await getAllFaceITChampionshipSubscriptions("empty-championship");

    expect(result).toEqual(emptyMock);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should preserve other fields from the first response", async () => {
    const firstPageMock = {
      items: Array(10)
        .fill(null)
        .map((_, i) => ({
          leader: `player${i}_id`,
          coleader: `player${i + 1}_id`,
          team: {
            team_id: `team${i}`,
            name: `Team ${i}`,
            team_type: "premade",
            members: [],
            leader: `player${i}_id`,
            chat_room_id: `chat${i}`,
            faceit_url: `https://faceit.com/team${i}`
          },
          group: 1,
          substitutes: [],
          roster: [`player${i}_id`, `player${i + 1}_id`],
          status: "registered"
        })),
      start: 0,
      end: 10,
      championship_name: "Test Championship",
      tournament_format: "single_elimination"
    };

    const secondPageMock = {
      items: [
        {
          leader: "player10_id",
          coleader: "player11_id",
          team: {
            team_id: "team10",
            name: "Team 10",
            team_type: "premade",
            members: [],
            leader: "player10_id",
            chat_room_id: "chat10",
            faceit_url: "https://faceit.com/team10"
          },
          group: 1,
          substitutes: [],
          roster: ["player10_id", "player11_id"],
          status: "registered"
        }
      ],
      start: 10,
      end: 11
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstPageMock
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondPageMock
      });

    const result =
      await getAllFaceITChampionshipSubscriptions("test-championship");

    expect(result).toEqual({
      ...firstPageMock,
      items: [...firstPageMock.items, ...secondPageMock.items],
      start: 0,
      end: 11
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).championship_name).toBe("Test Championship");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).tournament_format).toBe("single_elimination");
  });
});
