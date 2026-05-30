import { getRoundSwingEvents } from "./match-game-analysis.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery", () => ({ runQuery: jest.fn() }));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getRoundSwingEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries RoundSwingEvents for the given match game", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42);

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/FROM RoundSwingEvents/i);
    expect(params).toContain(42);
  });

  it("applies roundNumber filter when provided", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42, { roundNumber: 7 });

    const [query, params] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/round_number = \?/i);
    expect(params).toContain(7);
  });

  it("does not add round_number clause when roundNumber is omitted", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).not.toMatch(/round_number = \?/i);
  });

  it("orders by ABS(delta) DESC", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42);

    const [query] = mockRunQuery.mock.calls[0];
    expect(query).toMatch(/ORDER BY ABS\(delta\) DESC/i);
  });

  it("uses default limit of 5 when not specified", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42);

    const [, params] = mockRunQuery.mock.calls[0];
    expect((params as unknown[]).at(-1)).toBe(5);
  });

  it("uses custom limit when provided", async () => {
    mockRunQuery.mockResolvedValue([] as never);

    await getRoundSwingEvents(42, { limit: 10 });

    const [, params] = mockRunQuery.mock.calls[0];
    expect((params as unknown[]).at(-1)).toBe(10);
  });

  it("parses contributors JSON string into array", async () => {
    const contributors = [{ steam_id: "1001", contribution: 0.8 }];
    mockRunQuery.mockResolvedValue([
      {
        round_number: 3,
        time_in_round: 22.5,
        event_type: "kill",
        pre_win_prob: 0.6,
        post_win_prob: 0.3,
        delta: -0.3,
        primary_player_steam_id: "1001",
        contributors: JSON.stringify(contributors)
      }
    ] as never);

    const result = await getRoundSwingEvents(42);

    expect(result[0].contributors).toEqual(contributors);
  });

  it("handles null contributors column gracefully", async () => {
    mockRunQuery.mockResolvedValue([
      {
        round_number: 1,
        time_in_round: 5.0,
        event_type: "plant",
        pre_win_prob: 0.5,
        post_win_prob: 0.7,
        delta: 0.2,
        primary_player_steam_id: "1002",
        contributors: null
      }
    ] as never);

    const result = await getRoundSwingEvents(42);

    expect(result[0].contributors).toEqual([]);
  });
});
