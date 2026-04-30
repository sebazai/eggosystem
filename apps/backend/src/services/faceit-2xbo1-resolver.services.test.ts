import {
  resolveRoundRobinBo2SplitFromFaceit,
  type RoundRobinBo2SplitDecision,
  type SiblingDemoState,
  type ResolveRoundRobinBo2SplitFromFaceitParams
} from "./faceit-2xbo1-resolver.services";
import type { Match, MatchStatusFinishedWebhook } from "@eggosystem/types";
import { logger } from "../utils/app-logger";

jest.mock("../utils/app-logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const mockLoggerWarn = logger.warn as jest.MockedFunction<typeof logger.warn>;

const FACEIT_FORFEIT_STARTED_AT = "1970-01-01T00:00:00Z";
const REAL_STARTED_AT = "2025-04-29T19:00:00Z";
const FINISHED_AT = "2025-04-29T19:42:00Z";

const makeMatch = (overrides: Partial<Match>): Match => ({
  id: 1,
  league_id: 1,
  season_id: 1,
  stage: 0,
  start_timestamp: REAL_STARTED_AT,
  end_timestamp: null,
  best_of: 1,
  external_match_room_id: "1-room-x",
  status: "SCHEDULED",
  round: 1,
  group: 1,
  ...overrides
});

type FinishedPayload = MatchStatusFinishedWebhook["payload"];

const makeWebhookPayload = (
  overrides: Partial<FinishedPayload>
): FinishedPayload => ({
  id: "1-room-x",
  organizer_id: "org",
  region: "EU",
  game: "cs2",
  version: 0,
  entity: { id: "league", name: "League", type: "championship" },
  teams: [],
  created_at: REAL_STARTED_AT,
  updated_at: FINISHED_AT,
  started_at: REAL_STARTED_AT,
  finished_at: FINISHED_AT,
  ...overrides
});

const baseParams = (
  overrides: Partial<ResolveRoundRobinBo2SplitFromFaceitParams>
): ResolveRoundRobinBo2SplitFromFaceitParams => {
  const slot0 = makeMatch({
    id: 12571,
    external_match_room_id: "1-room-x",
    status: "SCHEDULED"
  });
  const slot1 = makeMatch({
    id: 12572,
    external_match_room_id: "1-room-x",
    status: "SCHEDULED"
  });
  return {
    externalMatchRoomId: "1-room-x",
    matchesByRoom: [slot0, slot1],
    webhookPayload: makeWebhookPayload({}),
    isForfeitWebhook: false,
    faceitMatchDetails: {},
    siblingDemoState: [
      { matchId: 12571, hasDemo: false },
      { matchId: 12572, hasDemo: false }
    ],
    ...overrides
  };
};

const forfeitPayload = (id: string = "1-room-x"): FinishedPayload =>
  makeWebhookPayload({
    id,
    created_at: FACEIT_FORFEIT_STARTED_AT,
    started_at: FACEIT_FORFEIT_STARTED_AT
  });

describe("resolveRoundRobinBo2SplitFromFaceit", () => {
  beforeEach(() => {
    mockLoggerWarn.mockClear();
  });

  describe("guard rails", () => {
    it("returns [] when matchesByRoom length !== 2", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({ matchesByRoom: [makeMatch({ id: 1 })] })
      );
      expect(result).toEqual([]);
    });

    it("returns [] when both siblings already terminal (short-circuit) and emits a structured warning", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          matchesByRoom: [
            makeMatch({ id: 12571, status: "FORFEIT" }),
            makeMatch({ id: 12572, status: "FINISHED" })
          ]
        })
      );
      expect(result).toEqual([]);
      expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
      const warnArg = mockLoggerWarn.mock.calls[0][0];
      expect(typeof warnArg).toBe("string");
      expect(warnArg).toContain("Both siblings already terminal");
      expect(warnArg).toContain("match_id=12571");
      expect(warnArg).toContain("FORFEIT");
      expect(warnArg).toContain("match_id=12572");
      expect(warnArg).toContain("FINISHED");
      expect(warnArg).toContain("no rows mutated");
    });

    it("returns [] when both siblings already terminal even on a forfeit webhook (warning emitted)", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: true,
          matchesByRoom: [
            makeMatch({ id: 12571, status: "FINISHED" }),
            makeMatch({ id: 12572, status: "FORFEIT" })
          ],
          webhookPayload: forfeitPayload()
        })
      );
      expect(result).toEqual([]);
      expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
      expect(mockLoggerWarn.mock.calls[0][0]).toContain("Webhook=forfeit");
    });

    it("does not warn for terminal-pair short-circuit when only one sibling is terminal (Case A path, no warning)", () => {
      resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          matchesByRoom: [
            makeMatch({ id: 12571, status: "FORFEIT" }),
            makeMatch({ id: 12572, status: "ONGOING" })
          ]
        })
      );
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });
  });

  describe("Case A: one sibling already terminal", () => {
    it("assigns FINISHED to remaining sibling on real finished webhook (slot 0 already FORFEIT)", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: false,
          matchesByRoom: [
            makeMatch({ id: 12571, status: "FORFEIT" }),
            makeMatch({ id: 12572, status: "SCHEDULED" })
          ]
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12572,
        target_status: "FINISHED",
        start_timestamp: REAL_STARTED_AT,
        end_timestamp: FINISHED_AT
      });
    });

    it("assigns FORFEIT to remaining sibling on forfeit webhook (slot 1 already FINISHED) — without overwriting start_timestamp", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: true,
          matchesByRoom: [
            makeMatch({ id: 12571, status: "SCHEDULED" }),
            makeMatch({ id: 12572, status: "FINISHED" })
          ],
          webhookPayload: forfeitPayload()
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12571,
        target_status: "FORFEIT",
        start_timestamp: null,
        end_timestamp: FINISHED_AT
      });
    });
  });

  describe("Case B: both siblings non-terminal + real finished webhook", () => {
    it("marks both siblings FINISHED with the real start/end timestamps", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({ isForfeitWebhook: false })
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12571,
        target_status: "FINISHED",
        start_timestamp: REAL_STARTED_AT,
        end_timestamp: FINISHED_AT
      });
      expect(result[1]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12572,
        target_status: "FINISHED",
        start_timestamp: REAL_STARTED_AT,
        end_timestamp: FINISHED_AT
      });
    });
  });

  describe("Case C: both siblings non-terminal + forfeit webhook", () => {
    const forfeitParamsBase = (
      overrides: Partial<ResolveRoundRobinBo2SplitFromFaceitParams>
    ): ResolveRoundRobinBo2SplitFromFaceitParams =>
      baseParams({
        isForfeitWebhook: true,
        webhookPayload: forfeitPayload(),
        ...overrides
      });

    it("forfeits the sibling WITHOUT a demo (slot 1 missing demo)", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        forfeitParamsBase({
          siblingDemoState: [
            { matchId: 12571, hasDemo: true },
            { matchId: 12572, hasDemo: false }
          ] satisfies SiblingDemoState[]
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12572,
        target_status: "FORFEIT",
        start_timestamp: null,
        end_timestamp: FINISHED_AT
      });
    });

    it("forfeits the sibling WITHOUT a demo (slot 0 missing demo) — covers room 1-f30abfb4 case (12571=FORFEIT)", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        forfeitParamsBase({
          siblingDemoState: [
            { matchId: 12571, hasDemo: false },
            { matchId: 12572, hasDemo: true }
          ] satisfies SiblingDemoState[]
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12571,
        target_status: "FORFEIT"
      });
    });

    it("when both lack demos, marks lower-index slot 0 FORFEIT and leaves slot 1 for next webhook", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        forfeitParamsBase({
          siblingDemoState: [
            { matchId: 12571, hasDemo: false },
            { matchId: 12572, hasDemo: false }
          ] satisfies SiblingDemoState[]
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject<Partial<RoundRobinBo2SplitDecision>>({
        match_id: 12571,
        target_status: "FORFEIT",
        start_timestamp: null,
        end_timestamp: FINISHED_AT
      });
    });

    it("when both already have demos, defensively coerces forfeit webhook to FINISHED for both", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        forfeitParamsBase({
          siblingDemoState: [
            { matchId: 12571, hasDemo: true },
            { matchId: 12572, hasDemo: true }
          ] satisfies SiblingDemoState[]
        })
      );
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.target_status)).toEqual([
        "FINISHED",
        "FINISHED"
      ]);
      expect(result.map((d) => d.match_id)).toEqual([12571, 12572]);
    });
  });

  describe("acceptance criteria scenarios", () => {
    // S1-AC-5: Room 1-f30abfb4-04e1-4d17-8245-b16614e5cf06 → 12571=FORFEIT, 12572=FINISHED
    it("S1-AC-5: forfeit webhook arriving while slot 1 already has a demo (FINISHED via demo path) ends with 12571 FORFEIT", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: true,
          matchesByRoom: [
            makeMatch({ id: 12571, status: "SCHEDULED" }),
            makeMatch({ id: 12572, status: "FINISHED" })
          ],
          webhookPayload: forfeitPayload(
            "1-f30abfb4-04e1-4d17-8245-b16614e5cf06"
          )
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].match_id).toBe(12571);
      expect(result[0].target_status).toBe("FORFEIT");
    });

    // S1-AC-6: Room 1-1fa9322f-... → 12033 and 12034 both terminal
    it("S1-AC-6: both non-terminal real finished webhook resolves both siblings to FINISHED", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: false,
          matchesByRoom: [
            makeMatch({ id: 12033, status: "ONGOING" }),
            makeMatch({ id: 12034, status: "ONGOING" })
          ],
          webhookPayload: makeWebhookPayload({
            id: "1-1fa9322f-e7b1-48f4-8331-cb9af44d893d"
          })
        })
      );
      expect(result).toHaveLength(2);
      expect(result.map((d) => d.match_id).sort()).toEqual([12033, 12034]);
      expect(result.every((d) => d.target_status === "FINISHED")).toBe(true);
    });

    // S1-AC-3: Slot assignment from veto/DB row order, not webhook arrival order
    it("S1-AC-3: slot 0 = matchesByRoom[0] regardless of which webhook arrived first", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          isForfeitWebhook: false,
          matchesByRoom: [
            makeMatch({ id: 100, status: "ONGOING" }),
            makeMatch({ id: 200, status: "ONGOING" })
          ]
        })
      );
      expect(result[0].match_id).toBe(100);
      expect(result[1].match_id).toBe(200);
    });

    // S1-AC-4: Already FINISHED rows never overwritten — Case A only emits for the remaining sibling.
    it("S1-AC-4: already-FINISHED row not overwritten — only remaining sibling is in decisions", () => {
      const result = resolveRoundRobinBo2SplitFromFaceit(
        baseParams({
          matchesByRoom: [
            makeMatch({ id: 12571, status: "FINISHED" }),
            makeMatch({ id: 12572, status: "ONGOING" })
          ]
        })
      );
      expect(result.find((d) => d.match_id === 12571)).toBeUndefined();
      expect(result.find((d) => d.match_id === 12572)).toBeDefined();
    });

    // S1-AC-2: All four terminal tuples supported.
    it.each([
      [
        "(FINISHED, FORFEIT) — slot 0 FINISHED, forfeit webhook resolves slot 1",
        { slot0Terminal: "FINISHED", isForfeit: true } as const
      ],
      [
        "(FORFEIT, FINISHED) — slot 0 FORFEIT, real finished webhook resolves slot 1",
        { slot0Terminal: "FORFEIT", isForfeit: false } as const
      ]
    ])(
      "S1-AC-2 mixed terminal tuple %s eventually written via two webhooks",
      (_label, { slot0Terminal, isForfeit }) => {
        const result = resolveRoundRobinBo2SplitFromFaceit(
          baseParams({
            isForfeitWebhook: isForfeit,
            matchesByRoom: [
              makeMatch({ id: 1, status: slot0Terminal }),
              makeMatch({ id: 2, status: "ONGOING" })
            ],
            webhookPayload: isForfeit
              ? forfeitPayload()
              : makeWebhookPayload({})
          })
        );
        expect(result).toHaveLength(1);
        expect(result[0].match_id).toBe(2);
        expect(result[0].target_status).toBe(
          isForfeit ? "FORFEIT" : "FINISHED"
        );
      }
    );
  });
});
