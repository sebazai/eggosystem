import {
  FACEIT_FORFEIT_STARTED_AT,
  isForfeitPayload
} from "./faceit-match-status-finished-detection";

/**
 * Expected FACEIT webhook payload shapes for match_status_finished.
 * Used to document and test detection logic.
 */
const EXPECTED_FACEIT_FORFEIT_STARTED_AT = "1970-01-01T00:00:00Z";

describe("faceit-match-status-finished-detection", () => {
  describe("FACEIT_FORFEIT_STARTED_AT", () => {
    it("equals FACEIT epoch timestamp for aborted/forfeited matches", () => {
      expect(FACEIT_FORFEIT_STARTED_AT).toBe(
        EXPECTED_FACEIT_FORFEIT_STARTED_AT
      );
    });
  });

  describe("isForfeitPayload", () => {
    it("returns true when payload has started_at = 1970-01-01T00:00:00Z (FACEIT forfeit/abort)", () => {
      const payloadFromFaceitForfeit = {
        started_at: "1970-01-01T00:00:00Z",
        finished_at: "2025-09-17T18:10:00Z"
      };
      expect(isForfeitPayload(payloadFromFaceitForfeit)).toBe(true);
    });

    it("returns false when payload has real started_at (match actually played)", () => {
      const payloadFromFaceitPlayed = {
        started_at: "2025-09-17T17:48:48Z",
        finished_at: "2025-09-17T18:37:35Z"
      };
      expect(isForfeitPayload(payloadFromFaceitPlayed)).toBe(false);
    });

    it("returns false for other ISO timestamps", () => {
      expect(isForfeitPayload({ started_at: "2026-01-29T19:10:22Z" })).toBe(
        false
      );
      expect(isForfeitPayload({ started_at: "2025-07-26T00:25:51Z" })).toBe(
        false
      );
    });

    it("treats exact FACEIT forfeit literal as forfeit", () => {
      const webhookPayloadLikeDb = {
        id: "1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f",
        started_at: "1970-01-01T00:00:00Z" as const,
        finished_at: "2025-09-17T17:25:29Z"
      };
      expect(isForfeitPayload(webhookPayloadLikeDb)).toBe(true);
    });

    it("returns false when started_at is undefined (treat as non-forfeit)", () => {
      expect(isForfeitPayload({ started_at: undefined })).toBe(false);
    });

    it("returns false when started_at is empty string", () => {
      expect(isForfeitPayload({ started_at: "" })).toBe(false);
    });
  });
});
