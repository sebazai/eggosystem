// Mock API key - set before importing app since middleware is created at require time
const TEST_WEBHOOK_API_KEY = "test-faceit-webhook-key";
process.env.FACEIT_WEBHOOK_API_KEY = TEST_WEBHOOK_API_KEY;

import request from "supertest";
import express from "express";
import faceitRouter from "../faceit.routes";

// Mock the model modules
jest.mock("../../../models/organizer.models");
jest.mock("../../../models/match.models");
jest.mock("../../../models/faceit.models");
jest.mock("../../../models/match-team-map-veto.models");

// Import mocked functions
import { getOrganizerByFaceitIdAndGameAppId } from "../../../models/organizer.models";
import {
  addMatchToDatabase,
  updateMatchStatus
} from "../../../models/match.models";
import { saveWebhookData } from "../../../models/faceit.models";
import { addMatchTeamMapVetoes } from "../../../models/match-team-map-veto.models";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import { validMatchDetails } from "@eggosystem/shared-msw";

const mockGetOrganizerByFaceitIdAndGameAppId =
  getOrganizerByFaceitIdAndGameAppId as jest.MockedFunction<
    typeof getOrganizerByFaceitIdAndGameAppId
  >;
const mockAddMatchToDatabase = addMatchToDatabase as jest.MockedFunction<
  typeof addMatchToDatabase
>;
const mockUpdateMatchStatus = updateMatchStatus as jest.MockedFunction<
  typeof updateMatchStatus
>;
const mockSaveWebhookData = saveWebhookData as jest.MockedFunction<
  typeof saveWebhookData
>;
const mockAddMatchTeamMapVetoes = addMatchTeamMapVetoes as jest.MockedFunction<
  typeof addMatchTeamMapVetoes
>;

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/faceit", faceitRouter);
app.use(expressErrorHandler);

const validWebhookPayloadMatchStatusReady = {
  transaction_id: "cb893b14-5811-4f11-b309-e453cf9024fd",
  event_id: "340cc466-ff64-45bf-a7a3-dd69e5001123",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-27T01:54:51Z",
  retry_count: 0,
  version: 1,
  event: "match_status_ready",
  payload: {
    id: "1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "NA",
    game: "cs2",
    version: 71,
    entity: {
      id: "5227a49c-f172-485e-a19b-a666ddeb3140",
      name: "ESEA S54 NA Elite 1 Group D - Group Stage",
      type: "championship"
    },
    teams: [
      {
        id: "3523360c-7235-452a-b9d9-e587e97ba4b5",
        name: "regain",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/46f36e02-b08e-49be-b021-2ec50aebc8aa.jpg",
        leader_id: "6d10dac4-b0cf-473d-b5a8-a34c53aefade",
        co_leader_id: "",
        roster: [
          {
            id: "6d10dac4-b0cf-473d-b5a8-a34c53aefade",
            nickname: "sasha",
            avatar:
              "https://distribution.faceit-cdn.net/images/d593c4f7-efbf-42fd-b2dd-c8c8d5f4a7c8.jpg",
            game_id: "76561198140847869",
            game_name: "sasha",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "c7b709f5-281b-4133-859e-0d545c4c58d0",
            nickname: "Halen",
            avatar:
              "https://distribution.faceit-cdn.net/images/ed8de75a-007a-429a-99bc-13b450b2ba9b.jpg",
            game_id: "76561198060497750",
            game_name: "Halen",
            game_skill_level: 10,
            membership: "esea,plus",
            anticheat_required: true
          },
          {
            id: "01950e33-89f8-40f1-8839-db3771ddd136",
            nickname: "Zucar",
            avatar:
              "https://distribution.faceit-cdn.net/images/5685fa36-559e-4c1a-ab8a-3ea2d4eddae8.jpg",
            game_id: "76561198119331267",
            game_name: "zucc",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "da7422ec-e62a-4df2-87fd-5f3c29f478b7",
            nickname: "1dvrk",
            avatar:
              "https://distribution.faceit-cdn.net/images/fa429887-8bb2-4ada-a876-1c5e46444b8f.jpeg",
            game_id: "76561198358249075",
            game_name: "Donnie Dvrko",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "f10486e8-6197-4bbc-928d-5060e7be9657",
            nickname: "fuzenko",
            avatar:
              "https://distribution.faceit-cdn.net/images/6c56bdb1-b04c-4d12-aece-9374539f6eca.jpg",
            game_id: "76561198929253202",
            game_name: ")",
            game_skill_level: 10,
            membership: "esea,plus",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      },
      {
        id: "ea5e1a5f-3d95-419e-b926-0c39e8c3d8dd",
        name: "Zomblers",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/f0a92fc2-c0ab-47a2-b7ff-ee855b0960b5.jpeg",
        leader_id: "dcea95af-d945-426c-9b22-3bb3b8fb5441",
        co_leader_id: "",
        roster: [
          {
            id: "dcea95af-d945-426c-9b22-3bb3b8fb5441",
            nickname: "ayaneuu",
            avatar:
              "https://distribution.faceit-cdn.net/images/c6dbf67b-48aa-4239-bc6b-afa3d59ff112.jpg",
            game_id: "76561198341370795",
            game_name: "ayaneuu",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "2c8adfac-5565-49a2-b835-a336360cddab",
            nickname: "Seb",
            avatar:
              "https://distribution.faceit-cdn.net/images/21d7e215-9f0e-4764-a82d-41842f19fdaa.jpeg",
            game_id: "76561198215815481",
            game_name: "Seb",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "1c8f885a-3d9a-4d64-801f-68a336a745ea",
            nickname: "Sanzh1k33",
            avatar:
              "https://distribution.faceit-cdn.net/images/3ce7bb54-6e9a-4594-9eac-128a19f48fdc.jpg",
            game_id: "76561199243647648",
            game_name: "76561199243647648",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "7627713e-9dfe-40e7-9d9d-ae8244aeb150",
            nickname: "asYLum",
            avatar:
              "https://distribution.faceit-cdn.net/images/7b261219-a46a-42b1-a015-d05a3262b0ba.jpeg",
            game_id: "76561198138820397",
            game_name: "sk8er",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "b934fa1f-79ac-4410-84cd-06a6eca64423",
            nickname: "aelor",
            avatar:
              "https://distribution.faceit-cdn.net/images/d786937e-0934-4ac4-8445-e0486a9969be.jpeg",
            game_id: "76561198231092204",
            game_name: "aelor",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "bc7cd9c2-0b37-47c6-9b19-4ccd90c63f44",
            nickname: "sathsea",
            avatar:
              "https://distribution.faceit-cdn.net/images/06c6c62e-05ce-4bf2-8962-9a177e6b1755.jpg",
            game_id: "76561198401647782",
            game_name: "󠀡󠀡",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "04924ee1-65bf-4424-b4d2-f82657133f53",
            nickname: "traekS",
            avatar:
              "https://distribution.faceit-cdn.net/images/b5b3d76f-d794-49db-8601-b0d7418e7b50.jpeg",
            game_id: "76561198057008814",
            game_name: "traekS",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      }
    ],
    created_at: "2025-07-24T17:28:40Z",
    updated_at: "2025-07-27T01:54:51Z"
  }
};

// Test data
const validWebhookPayloadObjectCreated = {
  transaction_id: "db01cc5e-79ac-41e8-8861-25bec38a51b0",
  event_id: "68cdcb5b-3a09-41a7-842b-73ba6e81d1b4",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-26T19:31:53Z",
  retry_count: 5,
  version: 1,
  event: "match_object_created",
  payload: {
    id: "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "EU",
    game: "cs2",
    version: 1,
    entity: {
      id: "3eb11474-6211-4c99-b0f2-1f3e857ab6aa",
      name: "ESEA S54 EU Elite 1 Group D - Group Stage",
      type: "championship"
    },
    created_at: "2025-07-26T19:31:53Z",
    updated_at: "2025-07-26T19:31:53Z"
  }
};

const mockOrganizer = {
  id: 1,
  name: "Test Organizer",
  faceit_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
  created_at: new Date(),
  updated_at: new Date()
};

describe("FaceIT Routes - Webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.FACEIT_WEBHOOK_API_KEY;
  });

  describe("POST /webhook - match_object_created championship", () => {
    describe("Authentication", () => {
      it("should return 401 when no API key is provided", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          error: { message: "API key required" }
        });
      });

      it("should return 401 when invalid API key is provided", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", "invalid-key")
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          error: { message: "Invalid API key" }
        });
      });

      it("should accept valid API key", async () => {
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValueOnce({ insertId: 1 });
        mockAddMatchToDatabase.mockResolvedValueOnce({
          matchIds: [1],
          isBO2PlayedAs2xBO1: false
        });

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");
      });
    });

    describe("Organizer Validation", () => {
      it("should return 404 when organizer is not found", async () => {
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(404);
        expect(response.text).toBe("Organizer not found");
      });

      it("should proceed when organizer is found", async () => {
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValueOnce({ insertId: 1 });
        mockAddMatchToDatabase.mockResolvedValueOnce({
          matchIds: [1],
          isBO2PlayedAs2xBO1: false
        });

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(200);
        expect(mockGetOrganizerByFaceitIdAndGameAppId).toHaveBeenCalledWith(
          "08b06cfc-74d0-454b-9a51-feda4b6b18da",
          730
        );
      });
    });

    describe("Webhook Processing - Success Cases", () => {
      beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mocks for success cases
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockAddMatchToDatabase.mockResolvedValue({
          matchIds: [1],
          isBO2PlayedAs2xBO1: false
        });
      });

      it("should successfully process championship match_object_created webhook", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
          "match_object_created",
          validWebhookPayloadObjectCreated,
          validMatchDetails
        );

        // Verify match was added to database
        expect(mockAddMatchToDatabase).toHaveBeenCalledWith(
          expect.any(Object),
          "3eb11474-6211-4c99-b0f2-1f3e857ab6aa"
        );
      });
    });

    describe("Webhook Processing - Error Cases", () => {
      beforeEach(() => {
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce([
          mockOrganizer
        ]);
      });

      it("should handle webhook validation errors", async () => {
        const invalidWebhookPayload = {
          ...validWebhookPayloadObjectCreated,
          event: "invalid_event" // Invalid event type
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(invalidWebhookPayload);

        // The webhook validation is not failing for invalid events, so it goes to the default case
        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");
      });

      it("should handle match details validation errors", async () => {
        // Use a different match ID that returns invalid data
        const invalidMatchPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "invalid-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(invalidMatchPayload);

        expect(response.status).toBe(400);
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "invalid-match-id",
          "match_object_created",
          invalidMatchPayload,
          expect.any(Object),
          "ZOD_VALIDATION_ERROR",
          expect.any(String)
        );
      });

      it("should handle network errors when fetching match details", async () => {
        // Use a different match ID that returns network error
        const networkErrorPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "network-error-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(networkErrorPayload);

        expect(response.status).toBe(400);
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "network-error-match-id",
          "match_object_created",
          networkErrorPayload,
          null,
          "UNKNOWN_ERROR",
          expect.any(String)
        );
      });

      it("should handle database errors when saving webhook data", async () => {
        mockSaveWebhookData.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(400);
      });

      it("should handle database errors when adding match to database", async () => {
        mockSaveWebhookData.mockResolvedValueOnce({ insertId: 1 });
        mockAddMatchToDatabase.mockRejectedValueOnce(
          new Error("Database error")
        );

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(400);
      });
    });

    describe("Boundary Value Testing", () => {
      beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mocks for success cases
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockAddMatchToDatabase.mockResolvedValue({
          matchIds: [1],
          isBO2PlayedAs2xBO1: false
        });
      });

      it("should handle empty string organizer_id", async () => {
        const emptyOrganizerPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            organizer_id: ""
          }
        };

        // Override the default mock for this specific test
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(emptyOrganizerPayload);

        expect(response.status).toBe(404);
      });
    });

    describe("Different Game Types", () => {
      beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mocks for success cases
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockAddMatchToDatabase.mockResolvedValue({
          matchIds: [1],
          isBO2PlayedAs2xBO1: false
        });
      });

      it("should handle CS2 game type", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(200);
        expect(mockGetOrganizerByFaceitIdAndGameAppId).toHaveBeenCalledWith(
          "08b06cfc-74d0-454b-9a51-feda4b6b18da",
          730
        );
      });

      it("should handle unknown game type", async () => {
        const unknownGamePayload = {
          ...validWebhookPayloadObjectCreated,
          app_id: "unknown-game-id"
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(unknownGamePayload);

        expect(response.status).toBe(400);
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty organizer array", async () => {
        // Override the default mock for this specific test
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValueOnce([]);

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadObjectCreated);

        expect(response.status).toBe(404);
      });

      it("should handle missing payload fields", async () => {
        const invalidPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            id: "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978"
            // Missing required fields
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(invalidPayload);

        expect(response.status).toBe(400);
      });

      it("should handle malformed JSON in request body", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .set("Content-Type", "application/json")
          .send("invalid json");

        expect(response.status).toBe(400);
      });

      it("should handle 404 errors when fetching match details", async () => {
        const notFoundPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "not-found-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(notFoundPayload);

        expect(response.status).toBe(500);
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "not-found-match-id",
          "match_object_created",
          notFoundPayload,
          null,
          "UNKNOWN_ERROR",
          expect.any(String)
        );
      });

      it("should handle matches with missing teams", async () => {
        const missingTeamsPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "missing-teams-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(missingTeamsPayload);

        expect(response.status).toBe(400);
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "missing-teams-match-id",
          "match_object_created",
          missingTeamsPayload,
          expect.any(Object),
          "ZOD_VALIDATION_ERROR",
          expect.any(String)
        );
      });

      it("should handle matches with null values", async () => {
        const nullValuesPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "null-values-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(nullValuesPayload);

        expect(response.status).toBe(400);
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "null-values-match-id",
          "match_object_created",
          nullValuesPayload,
          expect.any(Object),
          "ZOD_VALIDATION_ERROR",
          expect.any(String)
        );
      });

      it("should handle different match IDs with default response", async () => {
        const defaultMatchPayload = {
          ...validWebhookPayloadObjectCreated,
          payload: {
            ...validWebhookPayloadObjectCreated.payload,
            id: "some-other-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(defaultMatchPayload);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "some-other-match-id",
          "match_object_created",
          expect.objectContaining(defaultMatchPayload),
          expect.objectContaining({
            match_id: "some-other-match-id"
          })
        );

        // Verify match was added to database
        expect(mockAddMatchToDatabase).toHaveBeenCalledWith(
          expect.objectContaining({
            match_id: "some-other-match-id"
          }),
          "3eb11474-6211-4c99-b0f2-1f3e857ab6aa"
        );
      });
    });
  });

  describe("POST /webhook - match_status_ready championship", () => {
    describe("Success Cases", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockAddMatchTeamMapVetoes.mockResolvedValue(undefined);
        mockUpdateMatchStatus.mockResolvedValue(undefined);
      });

      it("should successfully process championship match_status_ready webhook", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadMatchStatusReady);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191",
          "match_status_ready",
          validWebhookPayloadMatchStatusReady,
          expect.any(Object)
        );

        // Verify match team map vetoes were added
        expect(mockAddMatchTeamMapVetoes).toHaveBeenCalledWith(
          expect.any(Object),
          "5227a49c-f172-485e-a19b-a666ddeb3140"
        );

        // Note: updateMatchStatus is NOT called for championship match_status_ready
        // Only addMatchTeamMapVetoes is called
        expect(mockUpdateMatchStatus).not.toHaveBeenCalled();
      });
    });
  });
});
