import { getChampionshipBracketMatchesCached } from "./faceit-bracket.services";

jest.mock("../utils/redisClient", () => {
  return {
    expireIn7Days: 7 * 24 * 60 * 60,
    redisClient: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    }
  };
});

jest.mock("../utils/app-logger", () => {
  return {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  };
});

const { redisClient } = jest.requireMock("../utils/redisClient") as {
  redisClient: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
};

function ensureGlobalFetch(): void {
  if (typeof globalThis.fetch === "function") return;
  globalThis.fetch = jest.fn() as typeof fetch;
}

function spyOnGlobalFetch(): jest.SpiedFunction<typeof fetch> {
  ensureGlobalFetch();
  return jest.spyOn(globalThis, "fetch");
}

describe("faceit-bracket.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureGlobalFetch();
  });

  it("fetches groups 1..3 bracket endpoints and normalizes to championship match items", async () => {
    redisClient.get.mockResolvedValue(null);

    const makeResponse = (payload: unknown) =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => payload
      }) as unknown as Response;

    const groupPayload = (group: number) => ({
      payload: {
        rounds: [{ number: 1, matches: [`g${group}-m1`] }],
        matches: {
          [`g${group}-m1`]: {
            id: `g${group}-m1`,
            status: "dummy",
            schedule: 1700000000123,
            bestOf: 3,
            factions: [
              { number: 1, entity: { id: `t${group}`, name: `Team ${group}` } },
              { number: 2 } // unknown opponent slot (should become TBD)
            ]
          }
        }
      }
    });

    const fetchMock = spyOnGlobalFetch().mockImplementation(
      async (url: unknown) => {
        const u = String(url);
        if (u.includes("/group/1/")) return makeResponse(groupPayload(1));
        if (u.includes("/group/2/")) return makeResponse(groupPayload(2));
        if (u.includes("/group/3/")) return makeResponse(groupPayload(3));
        throw new Error(`unexpected url: ${u}`);
      }
    );

    try {
      const items = await getChampionshipBracketMatchesCached("champ-x");

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(items).toHaveLength(3);

      const g1 = items.find((i) => i.group === 1);
      expect(g1).toMatchObject({
        match_id: "g1-m1",
        group: 1,
        round: 1,
        status: "SCHEDULED",
        best_of: 3,
        scheduled_at: 1700000000,
        teams: {
          faction1: { faction_id: "t1", name: "Team 1" },
          faction2: { faction_id: "", name: "TBD" }
        }
      });

      // cached
      expect(redisClient.set).toHaveBeenCalledTimes(1);
    } finally {
      fetchMock.mockRestore();
      ensureGlobalFetch();
    }
  });

  it("returns cached items without fetching", async () => {
    const cached = [
      {
        match_id: "m",
        group: 2,
        round: 6,
        status: "SCHEDULED",
        best_of: 3,
        teams: {
          faction1: { faction_id: "t1", name: "A", avatar: "" },
          faction2: { faction_id: "", name: "TBD", avatar: "" }
        }
      }
    ];
    redisClient.get.mockResolvedValue(JSON.stringify(cached));

    const fetchMock = spyOnGlobalFetch();
    try {
      const items = await getChampionshipBracketMatchesCached("champ-cache");

      expect(items).toEqual(cached);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
      ensureGlobalFetch();
    }
  });
});
