import { savePlayerRoundImpactsForGame } from "./player-round-impacts.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type DemoRoundImpact } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createImpact(
  roundNumber: number,
  steamId: string,
  kills: number
): DemoRoundImpact {
  return {
    RoundNumber: roundNumber,
    SteamID: steamId,
    Kills: kills,
    Assists: 0,
    FirstKill: false,
    Trades: 0,
    ADR: kills * 100,
    FlashAssists: 0,
    FirstKillFlashAssists: 0,
    ImpactScore: kills,
    EntryKill: false,
    ExitKill: false,
    BombPlanted: false,
    BombDefused: false,
    BombExploded: false,
    KillOpponentValue: 0,
    WinProbImpact: 0
  };
}

describe("savePlayerRoundImpactsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("deduplicates parser rows by round and steam id before insert", async () => {
    await savePlayerRoundImpactsForGame({
      matchGameId: 123123,
      roundImpacts: [
        createImpact(1, "76561198437815468", 0),
        createImpact(1, "76561198437815468", 2)
      ],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, flatValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO PlayerRoundImpacts/i);
    expect(flatValues).toEqual(
      expect.arrayContaining([
        123123,
        1,
        "76561198437815468",
        2 // last duplicate wins
      ])
    );
    expect((flatValues as unknown[]).length).toBe(21);
  });
});
