import { http, HttpResponse } from "msw";

export const validMatchDetails = {
  status: "SCHEDULED",
  teams: {
    faction1: {
      faction_id: "1c056a01-db80-4a06-a490-967a09db536f",
      leader: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
      avatar:
        "https://distribution.faceit-cdn.net/images/4da05e2d-a9c5-4745-9581-533a8e92090b.jpg",
      roster: [
        {
          player_id: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
          nickname: "Muk0s",
          avatar:
            "https://distribution.faceit-cdn.net/images/408befc7-f172-4827-a7ac-814762b7916a.jpeg",
          membership: "esea",
          game_player_id: "76561199074345785",
          game_player_name: "1437",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "99726d5a-04d8-4b74-a12d-b5e012ae745c",
          nickname: "anttzz",
          avatar:
            "https://distribution.faceit-cdn.net/images/71f8b04d-4c1d-471a-a058-062c59f36d1b.jpeg",
          membership: "esea",
          game_player_id: "76561198095744377",
          game_player_name: "дмитрий эмобой",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "cb38b461-9ead-4683-9406-237263c331db",
          nickname: "slaxejezzz",
          avatar:
            "https://distribution.faceit-cdn.net/images/f8b3f934-31c2-4a90-a0e2-15f6c74edf36.jpeg",
          membership: "esea",
          game_player_id: "76561198356252021",
          game_player_name: "seventeen",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "79cfeccb-f4b2-4fd4-86fe-4e9ed2f260bd",
          nickname: "eightz999",
          avatar:
            "https://distribution.faceit-cdn.net/images/91a8e063-fe49-4580-84b7-7f340d9d47a8.jpeg",
          membership: "esea",
          game_player_id: "76561198231705972",
          game_player_name: "eightz999",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "33c4e3c7-5428-46f2-bc0f-3fbdce907873",
          nickname: "abiraju",
          avatar:
            "https://distribution.faceit-cdn.net/images/2f3d9792-01a6-4d08-b8c8-265a8820cc6d.jpeg",
          membership: "premium",
          game_player_id: "76561199082242873",
          game_player_name: "AB",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "Hesta",
      type: "premade"
    },
    faction2: {
      faction_id: "4c6e75da-fa4d-4ba5-8100-f732536e573d",
      leader: "45b4cf2d-61a6-45c7-a240-460c8dbc400f",
      avatar:
        "https://distribution.faceit-cdn.net/images/11481031-c979-4291-97e3-4edad4bb0611.jpeg",
      roster: [
        {
          player_id: "45b4cf2d-61a6-45c7-a240-460c8dbc400f",
          nickname: "n0tice",
          avatar:
            "https://assets.faceit-cdn.net/avatars/45b4cf2d-61a6-45c7-a240-460c8dbc400f_1550503081706.jpg",
          membership: "premium",
          game_player_id: "76561198032071879",
          game_player_name: "n0tice.     ツ",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "964410bb-394d-4633-87fd-501ec0fbb914",
          nickname: "ritchiE",
          avatar: "",
          membership: "premium",
          game_player_id: "76561197969438752",
          game_player_name: "waterfish",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "7dfc0c4c-28a0-4126-8b97-349ba09bc314",
          nickname: "neptun59",
          avatar:
            "https://distribution.faceit-cdn.net/images/90da50fe-4af0-4089-916c-c4bd406f67f4.jpg",
          membership: "premium",
          game_player_id: "76561199063250592",
          game_player_name: "neptun",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "63615c98-d85d-4890-817a-28188dc699e1",
          nickname: "fleav",
          avatar:
            "https://distribution.faceit-cdn.net/images/be9753ea-a16b-4adc-9419-7289a434e1aa.jpeg",
          membership: "esea",
          game_player_id: "76561198149906662",
          game_player_name: "fisherman",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "bad6e784-c02b-47f7-8736-87a80a03a3d6",
          nickname: "noleN",
          avatar:
            "https://distribution.faceit-cdn.net/images/b0a4d4d4-cfed-4ec2-8ffd-a5becbf2f6f2.jpeg",
          membership: "premium",
          game_player_id: "76561198820452314",
          game_player_name: "永遠の神",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "MAESTRO",
      type: "premade"
    }
  },
  scheduled_at: 1753624800,
  match_id: "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
  version: 2,
  game: "cs2",
  region: "EU",
  competition_id: "3eb11474-6211-4c99-b0f2-1f3e857ab6aa",
  competition_type: "championship",
  competition_name: "ESEA S54 EU Elite 1 Group D - Group Stage",
  organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
  calculate_elo: false,
  chat_room_id: "match-1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
  best_of: 3,
  faceit_url:
    "https://www.faceit.com/{lang}/cs2/room/1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
  round: 1,
  group: 2
};

export const faceitMatchDetailsHandlers = [
  // Valid championship match details for the test match ID
  http.get(
    "https://open.faceit.com/data/v4/matches/:match_id",
    ({ params }) => {
      const { match_id } = params;

      // Return valid championship match details for the test match ID
      if (match_id === "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978") {
        return HttpResponse.json(validMatchDetails);
      }

      // Invalid match details for testing validation errors
      if (match_id === "invalid-match-id") {
        return HttpResponse.json({
          invalid: "data",
          missing_required_fields: true
        });
      }

      // Finished match for testing
      if (match_id === "finished-match-id") {
        return HttpResponse.json({
          status: "SCHEDULED",
          teams: {
            faction1: {
              faction_id: "1c056a01-db80-4a06-a490-967a09db536f",
              leader: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
              avatar:
                "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
              roster: [
                {
                  player_id: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
                  nickname: "player1",
                  avatar:
                    "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
                  membership: "premium",
                  game_player_id: "76561198012345678",
                  game_player_name: "player1",
                  game_skill_level: 10,
                  anticheat_required: false
                }
              ],
              substituted: false,
              name: "Team A",
              type: "premade"
            },
            faction2: {
              faction_id: "2c056a01-db80-4a06-a490-967a09db536f",
              leader: "d41561a6-a5f4-459c-8a5c-bde5f8eac911",
              avatar:
                "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
              roster: [
                {
                  player_id: "d41561a6-a5f4-459c-8a5c-bde5f8eac911",
                  nickname: "player2",
                  avatar:
                    "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
                  membership: "premium",
                  game_player_id: "76561198087654321",
                  game_player_name: "player2",
                  game_skill_level: 8,
                  anticheat_required: false
                }
              ],
              substituted: false,
              name: "Team B",
              type: "premade"
            }
          },
          results: {
            winner: "faction1",
            score: {
              faction1: 16,
              faction2: 14
            }
          },
          faceit_url: "https://www.faceit.com/en/cs2/room/finished-match-id",
          game: "cs2",
          region: "EU",
          competition_id: "test-competition-id",
          competition_type: "championship",
          competition_name: "Test Championship",
          organizer_id: "test-organizer-id",
          game_mode: "5v5",
          match_id: "finished-match-id",
          started_at: 1703123456,
          finished_at: 1703127000,
          best_of: 1,
          results_verified: true,
          match_type: "championship",
          version: 1,
          calculate_elo: false,
          chat_room_id: "match-finished-match-id",
          round: 1,
          group: 1,
          scheduled_at: 1703123456
        });
      }

      // Match with missing teams for testing error handling
      if (match_id === "missing-teams-match-id") {
        return HttpResponse.json({
          status: "SCHEDULED",
          teams: {},
          faceit_url:
            "https://www.faceit.com/en/cs2/room/missing-teams-match-id",
          game: "cs2",
          region: "EU",
          competition_id: "test-competition-id",
          competition_type: "championship",
          competition_name: "Test Championship",
          organizer_id: "test-organizer-id",
          game_mode: "5v5",
          match_id: "missing-teams-match-id",
          started_at: 1703123456,
          best_of: 1,
          match_type: "championship",
          version: 1,
          calculate_elo: false,
          chat_room_id: "match-missing-teams-match-id",
          round: 1,
          group: 1,
          scheduled_at: 1703123456
        });
      }

      // Match with null values for testing edge cases
      if (match_id === "null-values-match-id") {
        return HttpResponse.json({
          status: "SCHEDULED",
          teams: {
            faction1: {
              faction_id: "1c056a01-db80-4a06-a490-967a09db536f",
              leader: null,
              avatar:
                "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
              roster: [],
              substituted: false,
              name: null,
              type: "premade"
            },
            faction2: {
              faction_id: "2c056a01-db80-4a06-a490-967a09db536f",
              leader: null,
              avatar:
                "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
              roster: [],
              substituted: false,
              name: null,
              type: "premade"
            }
          },
          results: null,
          faceit_url: null,
          game: "cs2",
          region: "EU",
          competition_id: null,
          competition_type: "championship",
          competition_name: null,
          organizer_id: null,
          game_mode: "5v5",
          match_id: "null-values-match-id",
          started_at: null,
          finished_at: null,
          best_of: 1,
          match_type: "championship",
          version: 1,
          calculate_elo: false,
          chat_room_id: "match-null-values-match-id",
          round: 1,
          group: 1,
          scheduled_at: 1703123456
        });
      }

      // Network error simulation
      if (match_id === "network-error-match-id") {
        return HttpResponse.error();
      }

      // 404 Not Found simulation
      if (match_id === "not-found-match-id") {
        return new HttpResponse(null, { status: 404 });
      }

      // Default case - return valid championship match
      return HttpResponse.json({
        status: "SCHEDULED",
        teams: {
          faction1: {
            faction_id: "1c056a01-db80-4a06-a490-967a09db536f",
            leader: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
            avatar:
              "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
            roster: [
              {
                player_id: "c41561a6-a5f4-459c-8a5c-bde5f8eac911",
                nickname: "player1",
                avatar:
                  "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
                membership: "premium",
                game_player_id: "76561198012345678",
                game_player_name: "player1",
                game_skill_level: 10,
                anticheat_required: false
              }
            ],
            substituted: false,
            name: "Team A",
            type: "premade"
          },
          faction2: {
            faction_id: "2c056a01-db80-4a06-a490-967a09db536f",
            leader: "d41561a6-a5f4-459c-8a5c-bde5f8eac911",
            avatar:
              "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
            roster: [
              {
                player_id: "d41561a6-a5f4-459c-8a5c-bde5f8eac911",
                nickname: "player2",
                avatar:
                  "https://distribution.faceit-cdn.net/images/default-avatar.jpg",
                membership: "premium",
                game_player_id: "76561198087654321",
                game_player_name: "player2",
                game_skill_level: 8,
                anticheat_required: false
              }
            ],
            substituted: false,
            name: "Team B",
            type: "premade"
          }
        },
        results: {
          winner: "faction1",
          score: {
            faction1: 16,
            faction2: 14
          }
        },
        faceit_url: "https://www.faceit.com/en/cs2/room/default-match-id",
        game: "cs2",
        region: "EU",
        competition_id: "test-competition-id",
        competition_type: "championship",
        competition_name: "Test Championship",
        organizer_id: "test-organizer-id",
        game_mode: "5v5",
        match_id: match_id,
        started_at: 1703123456,
        finished_at: 1703127000,
        best_of: 1,
        results_verified: true,
        match_type: "championship",
        version: 1,
        calculate_elo: false,
        chat_room_id: `match-${match_id}`,
        round: 1,
        group: 1,
        scheduled_at: 1703123456
      });
    }
  ),

  // Championship details endpoint handler
  http.get(
    "https://open.faceit.com/data/v4/championships/:championship_id",
    ({ params }) => {
      const { championship_id } = params;

      // Return valid championship details for the test championship ID
      if (championship_id === "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978") {
        return HttpResponse.json({
          id: "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978",
          name: "Test Championship",
          organizer_id: "test-organizer-id",
          game: "cs2",
          region: "EU",
          status: "ACTIVE",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          start_date: "2025-01-01T00:00:00Z",
          end_date: "2025-12-31T23:59:59Z",
          prize_pool: 1000,
          currency: "USD",
          max_teams: 16,
          min_teams: 8,
          current_teams: 12,
          check_in_enabled: true,
          check_in_start: "2025-01-01T00:00:00Z",
          check_in_end: "2025-01-01T01:00:00Z",
          seeding_enabled: true,
          seeding_start: "2025-01-01T01:00:00Z",
          seeding_end: "2025-01-01T02:00:00Z",
          voting_enabled: true,
          voting_start: "2025-01-01T02:00:00Z",
          voting_end: "2025-01-01T03:00:00Z",
          faceit_url:
            "https://www.faceit.com/en/cs2/championships/1-9dd7f430-3bfa-42e9-84cd-1fb455d05978"
        });
      }

      // Default case - return valid championship details
      return HttpResponse.json({
        id: championship_id,
        name: "Default Championship",
        organizer_id: "test-organizer-id",
        game: "cs2",
        region: "EU",
        status: "ACTIVE",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        start_date: "2025-01-01T00:00:00Z",
        end_date: "2025-12-31T23:59:59Z",
        prize_pool: 1000,
        currency: "USD",
        max_teams: 16,
        min_teams: 8,
        current_teams: 12,
        check_in_enabled: true,
        check_in_start: "2025-01-01T00:00:00Z",
        check_in_end: "2025-01-01T01:00:00Z",
        seeding_enabled: true,
        seeding_start: "2025-01-01T01:00:00Z",
        seeding_end: "2025-01-01T02:00:00Z",
        voting_enabled: true,
        voting_start: "2025-01-01T02:00:00Z",
        voting_end: "2025-01-01T03:00:00Z",
        faceit_url: `https://www.faceit.com/en/cs2/championships/${championship_id}`
      });
    }
  )
];
