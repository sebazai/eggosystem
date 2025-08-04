import { type MatchDemoReadyWebhook } from "@eggosystem/types";

export const validWebhookMatchDemoReady = {
  transaction_id: "f389a1a4-594a-4100-b83e-447c87a18f12",
  event: "match_demo_ready" as const,
  event_id: "763f1bc5-b0c8-4ad1-a425-3d5d1bf28350",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-26T17:33:46Z",
  retry_count: 0,
  version: 1,
  payload: {
    id: "1-ffb4225f-ff51-42ed-acb5-af6714175934",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "EU",
    game: "cs2",
    entity: {
      id: "2a40fbe5-f71b-471e-b25d-7837c1b441bc",
      name: "ESEA S54 EU Elite 1 Group B - Group Stage",
      type: "championship"
    },
    created_at: "2025-07-24T17:57:42Z",
    updated_at: "2025-07-26T17:30:38Z",
    version: 149,
    demo_url:
      "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-3-1.dem.zst",
    teams: [
      {
        id: "f0eb455e-aadf-4029-9dea-b7806612e668",
        name: "SKYFURY",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/6d64c744-7377-4022-a478-edef98402281.jpg",
        leader_id: "b59b2cea-9cb2-4650-982e-0fece5d1aaf6",
        co_leader_id: "",
        roster: [
          {
            id: "95371621-2dc2-4ae2-8633-e70c1f754d25",
            nickname: "kiy0o",
            avatar:
              "https://distribution.faceit-cdn.net/images/6468ba66-f70f-4900-aa7b-d1137495e94f.jpg",
            game_id: "76561199017580923",
            game_name: "i'm back reboot",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "e55d08cc-a951-42db-9b2c-4fd3e41732ce",
            nickname: "smekk-",
            avatar:
              "https://distribution.faceit-cdn.net/images/5058303a-850d-4a46-9658-ff942252dd2f.jpeg",
            game_id: "76561198060923015",
            game_name: "ala de sub mine e prost",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "e3b1690b-c52a-4ba3-93b3-9878ddede3f7",
            nickname: "Shieldx",
            avatar:
              "https://assets.faceit-cdn.net/avatars/e3b1690b-c52a-4ba3-93b3-9878ddede3f7_1586901804791.jpg",
            game_id: "76561198253891911",
            game_name: "bobby fischer",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "e84bf029-00a2-4b7e-b3ec-4e58f786acd7",
            nickname: "-delle",
            avatar:
              "https://distribution.faceit-cdn.net/images/ce5c5183-a63c-4227-b14c-0b63ad437546.jpeg",
            game_id: "76561197972819559",
            game_name: "-delle",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "b59b2cea-9cb2-4650-982e-0fece5d1aaf6",
            nickname: "7oX1C",
            avatar:
              "https://distribution.faceit-cdn.net/images/0b5fbccd-b37d-40b0-b5b0-6e25a6cd87e7.jpg",
            game_id: "76561198312729649",
            game_name: "7oX1C",
            game_skill_level: 10,
            membership: "premium,esea"
          }
        ],
        substitutions: 0,
        substitutes: []
      },
      {
        id: "ecc58df2-7ee1-46d7-a370-3c389b7d355f",
        name: "Nuclear TigeRES",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/9fcf1838-545b-4b60-9ac8-f194b75480de.jpeg",
        leader_id: "82ed91b3-2d07-4740-949c-6f5b5e99b33b",
        co_leader_id: "",
        roster: [
          {
            id: "82ed91b3-2d07-4740-949c-6f5b5e99b33b",
            nickname: "Nuclear Tiger",
            avatar:
              "https://distribution.faceit-cdn.net/images/82ed91b3-2d07-4740-949c-6f5b5e99b33b_1586901804791.jpg",
            game_id: "76561198060923015",
            game_name: "Nuclear Tiger",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "e3b1690b-c52a-4ba3-93b3-9878ddede3f7",
            nickname: "Shieldx",
            avatar:
              "https://assets.faceit-cdn.net/avatars/e3b1690b-c52a-4ba3-93b3-9878ddede3f7_1586901804791.jpg",
            game_id: "76561198253891911",
            game_name: "bobby fischer",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "e84bf029-00a2-4b7e-b3ec-4e58f786acd7",
            nickname: "-delle",
            avatar:
              "https://distribution.faceit-cdn.net/images/ce5c5183-a63c-4227-b14c-0b63ad437546.jpeg",
            game_id: "76561197972819559",
            game_name: "-delle",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "b59b2cea-9cb2-4650-982e-0fece5d1aaf6",
            nickname: "7oX1C",
            avatar:
              "https://distribution.faceit-cdn.net/images/0b5fbccd-b37d-40b0-b5b0-6e25a6cd87e7.jpg",
            game_id: "76561198312729649",
            game_name: "7oX1C",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "95371621-2dc2-4ae2-8633-e70c1f754d25",
            nickname: "kiy0o",
            avatar:
              "https://distribution.faceit-cdn.net/images/6468ba66-f70f-4900-aa7b-d1137495e94f.jpg",
            game_id: "76561199017580923",
            game_name: "i'm back reboot",
            game_skill_level: 10,
            membership: "esea,plus"
          }
        ],
        substitutions: 0,
        substitutes: []
      }
    ]
  }
} satisfies MatchDemoReadyWebhook;
