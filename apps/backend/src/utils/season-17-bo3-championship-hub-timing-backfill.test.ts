import type { Knex } from "knex";

import { FACEIT_FORFEIT_STARTED_AT } from "./faceit-match-status-finished-detection";
import {
  computeSeason17Bo3FinishedMatchPatch,
  computeSeason17Bo3ReadyMatchPatch,
  hasPriorSuccessfulReadyWebhook,
  parseWebhookDataPayload
} from "./season-17-bo3-championship-hub-timing-backfill";

describe("season-17-bo3-championship-hub-timing-backfill", () => {
  describe("parseWebhookDataPayload", () => {
    it("returns payload from object data", () => {
      expect(
        parseWebhookDataPayload({
          payload: { updated_at: "2025-01-01T12:00:00Z" }
        })
      ).toEqual({ updated_at: "2025-01-01T12:00:00Z" });
    });

    it("parses JSON string data", () => {
      const raw = JSON.stringify({
        payload: { updated_at: "2025-01-01T12:00:00Z" }
      });
      expect(parseWebhookDataPayload(raw)).toEqual({
        updated_at: "2025-01-01T12:00:00Z"
      });
    });

    it("returns null when payload missing or not an object", () => {
      expect(parseWebhookDataPayload({})).toBeNull();
      expect(parseWebhookDataPayload({ payload: null })).toBeNull();
      expect(parseWebhookDataPayload({ payload: [] })).toBeNull();
    });
  });

  describe("computeSeason17Bo3ReadyMatchPatch", () => {
    it("maps ready updated_at to start_timestamp (DB format)", () => {
      expect(
        computeSeason17Bo3ReadyMatchPatch({
          updated_at: "2025-06-01T15:30:00.000Z"
        })
      ).toEqual({ start_timestamp: "2025-06-01 15:30:00" });
    });

    it("returns null when updated_at is not a string", () => {
      expect(
        computeSeason17Bo3ReadyMatchPatch({
          updated_at: 123 as unknown as string
        })
      ).toBeNull();
      expect(computeSeason17Bo3ReadyMatchPatch({})).toBeNull();
    });
  });

  describe("computeSeason17Bo3FinishedMatchPatch", () => {
    const played = {
      started_at: "2025-06-01T14:00:00.000Z",
      finished_at: "2025-06-01T16:00:00.000Z"
    };

    it("skips forfeit / aborted payloads (epoch started_at)", () => {
      expect(
        computeSeason17Bo3FinishedMatchPatch(
          {
            started_at: FACEIT_FORFEIT_STARTED_AT,
            finished_at: "2025-06-01T16:00:00.000Z"
          },
          false
        )
      ).toEqual({ action: "skip" });
      expect(
        computeSeason17Bo3FinishedMatchPatch(
          {
            started_at: FACEIT_FORFEIT_STARTED_AT,
            finished_at: "2025-06-01T16:00:00.000Z"
          },
          true
        )
      ).toEqual({ action: "skip" });
    });

    it("skips when finished_at or started_at is missing or not a string", () => {
      expect(
        computeSeason17Bo3FinishedMatchPatch(
          { started_at: played.started_at },
          true
        )
      ).toEqual({ action: "skip" });
      expect(
        computeSeason17Bo3FinishedMatchPatch(
          { finished_at: played.finished_at } as Record<string, unknown>,
          true
        )
      ).toEqual({ action: "skip" });
    });

    it("with prior ready: end_timestamp + FINISHED only (no start overwrite)", () => {
      expect(computeSeason17Bo3FinishedMatchPatch(played, true)).toEqual({
        action: "update_end_only",
        patch: {
          end_timestamp: "2025-06-01 16:00:00",
          status: "FINISHED"
        }
      });
    });

    it("without prior ready: full start + end + FINISHED fallback", () => {
      expect(computeSeason17Bo3FinishedMatchPatch(played, false)).toEqual({
        action: "update_full",
        patch: {
          start_timestamp: "2025-06-01 14:00:00",
          end_timestamp: "2025-06-01 16:00:00",
          status: "FINISHED"
        }
      });
    });
  });

  describe("hasPriorSuccessfulReadyWebhook", () => {
    function mockKnexChain(firstResult: unknown) {
      const first = jest.fn().mockResolvedValue(firstResult);
      const chain: Record<string, jest.Mock> = {};
      const self = chain as unknown as {
        select: jest.Mock;
        where: jest.Mock;
        whereNull: jest.Mock;
        whereRaw: jest.Mock;
        first: jest.Mock;
      };
      self.select = jest.fn().mockReturnValue(self);
      self.where = jest.fn().mockReturnValue(self);
      self.whereNull = jest.fn().mockReturnValue(self);
      self.whereRaw = jest.fn().mockReturnValue(self);
      self.first = first;
      const knex = jest.fn(() => self) as unknown as Knex;
      return { knex, self, first };
    }

    it("returns true when an earlier ready row exists", async () => {
      const { knex, self } = mockKnexChain({ id: 10 });
      await expect(
        hasPriorSuccessfulReadyWebhook(
          knex,
          "room-1",
          new Date("2025-06-01T17:00:00Z"),
          99
        )
      ).resolves.toBe(true);
      expect(knex).toHaveBeenCalledWith("FaceitWebhooks");
      expect(self.whereRaw).toHaveBeenCalledWith(
        "(received_at < ? OR (received_at = ? AND id < ?))",
        [new Date("2025-06-01T17:00:00Z"), new Date("2025-06-01T17:00:00Z"), 99]
      );
    });

    it("returns false when no prior ready row", async () => {
      const { knex } = mockKnexChain(undefined);
      await expect(
        hasPriorSuccessfulReadyWebhook(
          knex,
          "room-1",
          new Date("2025-06-01T17:00:00Z"),
          99
        )
      ).resolves.toBe(false);
    });
  });
});
