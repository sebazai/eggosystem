import {
  validateMatchObjectCreatedWebhook,
  FaceitGame
} from "@eggosystem/types";
import { z } from "zod";

describe("Webhook Validation Tests", () => {
  describe("match_object_created webhook validation", () => {
    it("should successfully validate webhook with cs2 game", () => {
      // This is the webhook payload from the user's example
      const webhookData = {
        transaction_id: "88bdd47a-9129-4b33-a266-07e69168df30",
        event: "match_object_created",
        event_id: "662f6d8a-040c-44e0-9c40-29bdcdb82611",
        third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
        app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
        timestamp: "2025-08-26T17:40:17Z",
        retry_count: 3,
        version: 1,
        payload: {
          id: "1-ff6d7b57-25b7-4f02-9143-c2d7f85f2668",
          organizer_id: "d2372a88-623d-4ca3-9248-a480b6dfbe1a",
          region: "EU",
          game: "cs2",
          version: 1,
          entity: {
            id: "25f7ebb8-9dcf-45bd-9652-84aafb185ed6",
            name: "7 DIV S4 Lohko B",
            type: "championship"
          },
          created_at: "2025-08-26T17:40:15Z",
          updated_at: "2025-08-26T17:40:15Z"
        }
      };

      // This should pass validation
      const result = validateMatchObjectCreatedWebhook(webhookData);
      expect(result).toBeDefined();
      expect(result.payload.game).toBe("cs2");
    });

    // Test direct enum validation with import at the top level
    it("should validate enum directly with top-level import", () => {
      // Create a schema that directly uses z.enum(FaceitGame)
      const schema = z.object({
        game: z.enum(FaceitGame)
      });

      // This should pass validation
      const result = schema.parse({ game: "cs2" });
      expect(result).toBeDefined();
      expect(result.game).toBe("cs2");
    });

    // Test with a plain JavaScript object - should work now with our fix
    it("should handle plain JavaScript objects as enums", () => {
      // Create a mock enum as a plain JavaScript object
      const MockFaceitGame = {
        CS2: "cs2",
        CSGO: "csgo"
      };

      // This should now work with our fix
      const schema = z.object({
        game: z.enum(MockFaceitGame)
      });

      // Should validate successfully
      const result = schema.parse({ game: "cs2" });
      expect(result).toBeDefined();
      expect(result.game).toBe("cs2");
    });
  });
});
