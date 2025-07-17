import { validateMatchDemoReadyWebhook } from "@eggosystem/types";

describe("MatchDemoReadyWebhook Validation", () => {
  it("should validate championship webhook with full team structure", () => {
    const championshipWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "test-organizer",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Test Championship",
          type: "championship"
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            type: "premade",
            avatar: "https://example.com/avatar1.jpg",
            leader_id: "leader1-id",
            co_leader_id: "co-leader1-id",
            roster: [
              {
                id: "player1-id",
                nickname: "Player1",
                avatar: "https://example.com/player1.jpg",
                game_id: "76561198000000001",
                game_name: "Player1",
                game_skill_level: 5,
                membership: "free",
                anticheat_required: true
              }
            ],
            substitutions: 0,
            substitutes: []
          },
          {
            id: "team2-id",
            name: "Team 2",
            type: "premade",
            avatar: "https://example.com/avatar2.jpg",
            leader_id: "leader2-id",
            co_leader_id: "co-leader2-id",
            roster: [
              {
                id: "player2-id",
                nickname: "Player2",
                avatar: "https://example.com/player2.jpg",
                game_id: "76561198000000002",
                game_name: "Player2",
                game_skill_level: 4,
                membership: "free",
                anticheat_required: false
              }
            ],
            substitutions: 0,
            substitutes: []
          }
        ]
      }
    };

    expect(() =>
      validateMatchDemoReadyWebhook(championshipWebhook)
    ).not.toThrow();
  });

  it("should validate matchmaking webhook with simplified team structure", () => {
    const matchmakingWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "faceit",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Europe 5v5 Queue",
          type: "matchmaking"
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            players: []
          },
          {
            id: "team2-id",
            name: "Team 2",
            players: []
          }
        ]
      }
    };

    expect(() =>
      validateMatchDemoReadyWebhook(matchmakingWebhook)
    ).not.toThrow();
  });

  it("should validate the actual matchmaking webhook that was causing the error", () => {
    const actualMatchmakingWebhook = {
      transaction_id: "c0df7d03-460a-46fc-8843-cb058ad24530",
      event: "match_demo_ready",
      event_id: "91e84fe6-f606-496b-979c-07275ae76363",
      third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
      app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
      timestamp: "2025-07-17T18:41:52Z",
      retry_count: 2,
      version: 1,
      payload: {
        id: "1-b2477eb4-6628-4a17-b5b3-65eb0174fdfd",
        organizer_id: "faceit",
        region: "EU",
        game: "cs2",
        entity: {
          id: "f4148ddd-bce8-41b8-9131-ee83afcdd6dd",
          name: "Europe 5v5 Queue",
          type: "matchmaking"
        },
        created_at: "2025-07-17T17:50:48Z",
        updated_at: "2025-07-17T18:38:50Z",
        version: 42,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-b2477eb4-6628-4a17-b5b3-65eb0174fdfd-1-1.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            players: []
          },
          {
            id: "team2-id",
            name: "Team 2",
            players: []
          }
        ]
      }
    };

    expect(() =>
      validateMatchDemoReadyWebhook(actualMatchmakingWebhook)
    ).not.toThrow();
  });

  it("should reject webhook with invalid team structure", () => {
    const invalidWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "faceit",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Test Match",
          type: "matchmaking"
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            // Missing required 'name' field
            players: []
          }
        ]
      }
    };

    expect(() => validateMatchDemoReadyWebhook(invalidWebhook)).toThrow();
  });

  it("should reject webhook with invalid demo URL", () => {
    const invalidWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "faceit",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Test Match",
          type: "invalid-type" // Invalid entity type
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            players: []
          }
        ]
      }
    };

    expect(() => validateMatchDemoReadyWebhook(invalidWebhook)).toThrow();
  });

  it("should validate webhook with championship entity type", () => {
    const championshipWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "test-organizer",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Test Championship",
          type: "championship" // Valid entity type
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            players: []
          }
        ]
      }
    };

    expect(() =>
      validateMatchDemoReadyWebhook(championshipWebhook)
    ).not.toThrow();
  });

  it("should validate webhook with matchmaking entity type", () => {
    const matchmakingWebhook = {
      transaction_id: "test-transaction-id",
      event: "match_demo_ready",
      event_id: "test-event-id",
      third_party_id: "test-third-party-id",
      app_id: "test-app-id",
      timestamp: "2025-01-27T10:00:00Z",
      retry_count: 0,
      version: 1,
      payload: {
        id: "1-test-match-id",
        organizer_id: "faceit",
        region: "EU",
        game: "cs2",
        entity: {
          id: "test-entity-id",
          name: "Europe 5v5 Queue",
          type: "matchmaking" // Valid entity type
        },
        created_at: "2025-01-27T09:00:00Z",
        updated_at: "2025-01-27T10:00:00Z",
        version: 1,
        demo_url:
          "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/test-match.dem.zst",
        teams: [
          {
            id: "team1-id",
            name: "Team 1",
            players: []
          }
        ]
      }
    };

    expect(() =>
      validateMatchDemoReadyWebhook(matchmakingWebhook)
    ).not.toThrow();
  });
});
