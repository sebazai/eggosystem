import { saveRoundSwingEventsForGame } from "./round-swing-events.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type RoundSwingEvent } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockConnection = {} as PoolConnection;

function createSwingEvent(
  overrides: Partial<RoundSwingEvent> = {}
): RoundSwingEvent {
  return {
    round_number: 5,
    time_in_round: 42.18,
    event_type: "kill",
    pre_win_prob: 0.62,
    post_win_prob: 0.31,
    delta: -0.31,
    primary_player: 100000001,
    contributors: [
      { steam_id: 100000001, contribution: 0.85 },
      { steam_id: 100000002, contribution: 0.15 }
    ],
    ...overrides
  };
}

describe("saveRoundSwingEventsForGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([] as never);
  });

  it("always deletes existing rows for the match game first", async () => {
    await saveRoundSwingEventsForGame({
      matchGameId: 42,
      events: [],
      connection: mockConnection
    });

    const [deleteQuery, deleteParams] = mockRunQuery.mock.calls[0];
    expect(deleteQuery).toMatch(
      /DELETE FROM RoundSwingEvents WHERE match_game_id/i
    );
    expect(deleteParams).toEqual([42]);
  });

  it("only deletes when events array is empty", async () => {
    await saveRoundSwingEventsForGame({
      matchGameId: 1,
      events: [],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts all events after delete", async () => {
    await saveRoundSwingEventsForGame({
      matchGameId: 10,
      events: [createSwingEvent(), createSwingEvent({ round_number: 6 })],
      connection: mockConnection
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const [insertQuery, insertValues] = mockRunQuery.mock.calls[1];
    expect(insertQuery).toMatch(/INSERT INTO RoundSwingEvents/i);
    expect((insertValues as unknown[]).length).toBe(18); // 9 cols × 2 rows
  });

  it("serialises contributors as a JSON string with steam IDs as strings", async () => {
    await saveRoundSwingEventsForGame({
      matchGameId: 1,
      events: [createSwingEvent()],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    const contributorsJson = (values as unknown[])[8] as string;
    const parsed = JSON.parse(contributorsJson) as Array<{
      steam_id: string;
      contribution: number;
    }>;

    expect(parsed).toHaveLength(2);
    expect(parsed[0].steam_id).toBe("100000001");
    expect(parsed[0].contribution).toBe(0.85);
    expect(parsed[1].steam_id).toBe("100000002");
  });

  it("stores empty JSON array when contributors is absent", async () => {
    const event = createSwingEvent({ contributors: undefined as never });

    await saveRoundSwingEventsForGame({
      matchGameId: 1,
      events: [event],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    expect((values as unknown[])[8]).toBe("[]");
  });

  it("stores primary_player as a string", async () => {
    await saveRoundSwingEventsForGame({
      matchGameId: 1,
      events: [createSwingEvent({ primary_player: 100000099 })],
      connection: mockConnection
    });

    const [, values] = mockRunQuery.mock.calls[1];
    expect((values as unknown[])[7]).toBe("100000099");
  });
});
