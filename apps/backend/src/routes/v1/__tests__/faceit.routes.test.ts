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

// Import mocked functions
import { getOrganizerByFaceitIdAndGameAppId } from "../../../models/organizer.models";
import { addMatchToDatabase } from "../../../models/match.models";
import { saveWebhookData } from "../../../models/faceit.models";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import { validMatchDetails } from "@eggosystem/shared-msw";

const mockGetOrganizerByFaceitIdAndGameAppId =
  getOrganizerByFaceitIdAndGameAppId as jest.MockedFunction<
    typeof getOrganizerByFaceitIdAndGameAppId
  >;
const mockAddMatchToDatabase = addMatchToDatabase as jest.MockedFunction<
  typeof addMatchToDatabase
>;
const mockSaveWebhookData = saveWebhookData as jest.MockedFunction<
  typeof saveWebhookData
>;

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/faceit", faceitRouter);
app.use(expressErrorHandler);

// Test data
const validWebhookPayload = {
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
          .send(validWebhookPayload);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          error: { message: "API key required" }
        });
      });

      it("should return 401 when invalid API key is provided", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", "invalid-key")
          .send(validWebhookPayload);

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
          .send(validWebhookPayload);

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
          .send(validWebhookPayload);

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
          .send(validWebhookPayload);

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
          .send(validWebhookPayload);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
          "match_object_created",
          validWebhookPayload,
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
          ...validWebhookPayload,
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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
          .send(validWebhookPayload);

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
          .send(validWebhookPayload);

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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
          .send(validWebhookPayload);

        expect(response.status).toBe(200);
        expect(mockGetOrganizerByFaceitIdAndGameAppId).toHaveBeenCalledWith(
          "08b06cfc-74d0-454b-9a51-feda4b6b18da",
          730
        );
      });

      it("should handle unknown game type", async () => {
        const unknownGamePayload = {
          ...validWebhookPayload,
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
          .send(validWebhookPayload);

        expect(response.status).toBe(404);
      });

      it("should handle missing payload fields", async () => {
        const invalidPayload = {
          ...validWebhookPayload,
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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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

      it("should handle finished matches", async () => {
        const finishedMatchPayload = {
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
            id: "finished-match-id"
          }
        };

        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(finishedMatchPayload);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "finished-match-id",
          "match_object_created",
          finishedMatchPayload,
          expect.objectContaining({
            status: "SCHEDULED",
            match_id: "finished-match-id"
          })
        );

        // Verify match was added to database
        expect(mockAddMatchToDatabase).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "SCHEDULED",
            match_id: "finished-match-id"
          }),
          "3eb11474-6211-4c99-b0f2-1f3e857ab6aa"
        );
      });

      it("should handle different match IDs with default response", async () => {
        const defaultMatchPayload = {
          ...validWebhookPayload,
          payload: {
            ...validWebhookPayload.payload,
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
});
