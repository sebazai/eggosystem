// Mock API key - set before importing app since middleware is created at require time
const TEST_WEBHOOK_API_KEY = "test-faceit-webhook-key";
process.env.FACEIT_WEBHOOK_API_KEY = TEST_WEBHOOK_API_KEY;

import request from "supertest";
import express from "express";
import faceitRouter from "./faceit.routes";

// Mock the model modules
jest.mock("../../models/organizer.models");
jest.mock("../../models/match.models");
jest.mock("../../models/faceit.models");
jest.mock("../../models/match-team-map-veto.models");
jest.mock("../../models/game.models");
jest.mock("../../models/season-team-players.models");
jest.mock("../../models/season-league.models");
jest.mock("../../models/season-league-external-id.models");

// Import mocked functions
import {
  getOrganizerByFaceitIdAndGameAppId,
  getOrganizerFaceitActiveSeasonForApp
} from "../../models/organizer.models";
import {
  addMatchToDatabase,
  updateMatchStatus,
  updateMatchFinished,
  updateMatchEndTime
} from "../../models/match.models";
import { saveWebhookData } from "../../models/faceit.models";
import { addMatchTeamMapVetoes } from "../../models/match-team-map-veto.models";
import { addMatchGameToDatabaseAndProcessDemo } from "../../models/game.models";
import { validatePlayersInTeams } from "../../models/season-team-players.models";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import * as seasonLeagueExternalIdServices from "../../services/season-league-external-id.services";
import * as faceitServices from "../../services/faceit.services";
import { validMatchDetailsMatchDemoReady } from "@eggosystem/shared-msw";
import { getSeasonLeagueBySeasonAndFaceitName } from "../../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../../models/season-league-external-id.models";
import {
  type MatchObjectCreatedWebhook,
  type MatchDemoReadyWebhook,
  type MatchStatusReadyWebhook,
  type FaceitGame,
  type Season,
  type SeasonLeague,
  type MatchStatusFinishedWebhook
} from "@eggosystem/types";

const mockGetOrganizerByFaceitIdAndGameAppId =
  getOrganizerByFaceitIdAndGameAppId as jest.MockedFunction<
    typeof getOrganizerByFaceitIdAndGameAppId
  >;
const mockGetOrganizerActiveSeasonForApp =
  getOrganizerFaceitActiveSeasonForApp as jest.MockedFunction<
    typeof getOrganizerFaceitActiveSeasonForApp
  >;
const mockAddMatchToDatabase = addMatchToDatabase as jest.MockedFunction<
  typeof addMatchToDatabase
>;
const mockUpdateMatchStatus = updateMatchStatus as jest.MockedFunction<
  typeof updateMatchStatus
>;
const mockUpdateMatchFinished = updateMatchFinished as jest.MockedFunction<
  typeof updateMatchFinished
>;
const mockUpdateMatchEndTime = updateMatchEndTime as jest.MockedFunction<
  typeof updateMatchEndTime
>;
const mockSaveWebhookData = saveWebhookData as jest.MockedFunction<
  typeof saveWebhookData
>;
const mockAddMatchTeamMapVetoes = addMatchTeamMapVetoes as jest.MockedFunction<
  typeof addMatchTeamMapVetoes
>;
const mockAddMatchGamesForMatch =
  addMatchGameToDatabaseAndProcessDemo as jest.MockedFunction<
    typeof addMatchGameToDatabaseAndProcessDemo
  >;
const mockValidatePlayersInTeams =
  validatePlayersInTeams as jest.MockedFunction<typeof validatePlayersInTeams>;
const mockGetSeasonLeagueBySeasonAndFaceitName =
  getSeasonLeagueBySeasonAndFaceitName as jest.MockedFunction<
    typeof getSeasonLeagueBySeasonAndFaceitName
  >;
const mockInsertSeasonLeagueExternalId =
  insertSeasonLeagueExternalId as jest.MockedFunction<
    typeof insertSeasonLeagueExternalId
  >;

// Create test app
const app = express();
app.use(express.json());
app.use("/api/v1/faceit", faceitRouter);
app.use(expressErrorHandler);

export const validWebhookMatchDemoReady = {
  transaction_id: "f389a1a4-594a-4100-b83e-447c87a18f12",
  event: "match_demo_ready",
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
            id: "6c8cb1e8-726a-42aa-9b64-486b1ef68a56",
            nickname: "re1gn999",
            avatar:
              "https://distribution.faceit-cdn.net/images/20bd9982-c24d-4024-9b11-6f343106f1a4.jpg",
            game_id: "76561198946151017",
            game_name: "Flash Baron",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "75b7d8c4-e346-492c-adef-a91fffeb3886",
            nickname: "z1k4-",
            avatar:
              "https://distribution.faceit-cdn.net/images/45077340-e9d4-4e0d-81b8-495af471378b.jpeg",
            game_id: "76561198156774221",
            game_name: "payk52",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "37a13cea-9f8b-45d3-9886-40faf2506d69",
            nickname: "m1QUSE272",
            avatar:
              "https://distribution.faceit-cdn.net/images/492fe7e4-f682-4132-b255-e697995ce60d.jpeg",
            game_id: "76561198832142602",
            game_name: "m1",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "53bcb68e-bca1-40de-8ec8-b0df14c51d04",
            nickname: "tonyblack-",
            avatar:
              "https://assets.faceit-cdn.net/avatars/53bcb68e-bca1-40de-8ec8-b0df14c51d04_1550488509052.png",
            game_id: "76561197976004330",
            game_name: "MENYATUTNET",
            game_skill_level: 10,
            membership: "premium,esea"
          },
          {
            id: "82ed91b3-2d07-4740-949c-6f5b5e99b33b",
            nickname: "mac10only-",
            avatar:
              "https://distribution.faceit-cdn.net/images/108df4f3-4109-43a4-a747-fac20d4712ff.jpeg",
            game_id: "76561199036285926",
            game_name: "gost",
            game_skill_level: 10,
            membership: "esea,plus"
          },
          {
            id: "09013eac-138e-47ca-a38f-2ba9021c975f",
            nickname: "flouzer",
            avatar:
              "https://distribution.faceit-cdn.net/images/88ea680e-ea5b-437f-86bc-cf8f898949b2.jpeg",
            game_id: "76561199181360085",
            game_name: "los3treak enjoyer",
            game_skill_level: 10,
            membership: "premium,esea"
          }
        ],
        substitutions: 0,
        substitutes: []
      }
    ]
  }
} satisfies MatchDemoReadyWebhook;

export const validWebhookPayloadMatchStatusFinished = {
  transaction_id: "d7da69a4-4622-4faf-8efc-40ec7153cf40",
  event: "match_status_finished",
  event_id: "a86b09ad-622f-45b6-a708-fcaf9088bb69",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-26T01:05:19Z",
  retry_count: 0,
  version: 1,
  payload: {
    id: "1-dba8981d-5647-466a-be32-12a06fb8fc31",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "NA",
    game: "cs2",
    version: 126,
    entity: {
      id: "ec39d65c-4069-4c0c-b2e1-5f957e7787f1",
      name: "ESEA S54 NA Elite 1 Group C - Group Stage",
      type: "championship"
    },
    teams: [
      {
        id: "d36ca2d0-d8f0-4c1d-9c1c-5b28cc58e532",
        name: "JERSA ESPORTS",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/6caffc2a-38bb-4437-9c28-4f5152aa3916.jpg",
        leader_id: "2afb9303-f70f-4d47-857c-ddc69e3da895",
        co_leader_id: "",
        roster: [
          {
            id: "fd27d75a-1f51-4abd-a4df-56eb5416776b",
            nickname: "BabyRage_S",
            avatar:
              "https://distribution.faceit-cdn.net/images/2a191b4e-cef5-4491-b757-759a48854c0b.jpeg",
            game_id: "76561198099461085",
            game_name: "4 burros conmigo 5 dxdx",
            game_skill_level: 10,
            membership: "esea",
            anticheat_required: true
          },
          {
            id: "c2e283d5-5803-4be3-abb6-1ded6e9ff5cd",
            nickname: "zockie",
            avatar:
              "https://assets.faceit-cdn.net/avatars/c2e283d5-5803-4be3-abb6-1ded6e9ff5cd_1550612021861.jpg",
            game_id: "76561198067615374",
            game_name: "zockie",
            game_skill_level: 10,
            membership: "esea",
            anticheat_required: true
          },
          {
            id: "27e9176b-f524-42c2-bb89-a70cbcb78103",
            nickname: "Kuu",
            avatar:
              "https://distribution.faceit-cdn.net/images/5164be54-6bf7-458c-aeab-f14491fcab0d.jpeg",
            game_id: "76561198255290780",
            game_name: "Speed#",
            game_skill_level: 9,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "fff8b7eb-ed82-406a-b869-d44a88bf7eaa",
            nickname: "Slayerh-",
            avatar:
              "https://distribution.faceit-cdn.net/images/48dc8c01-dc4b-4378-a171-ae64ad16d175.jpeg",
            game_id: "76561198277725019",
            game_name: "Slayerh",
            game_skill_level: 10,
            membership: "esea,plus",
            anticheat_required: true
          },
          {
            id: "2afb9303-f70f-4d47-857c-ddc69e3da895",
            nickname: "1AYALA",
            avatar:
              "https://distribution.faceit-cdn.net/images/d6a1ff8e-4afd-4f66-a253-db792dbd5833.jpg",
            game_id: "76561198953646715",
            game_name: "nodeal27",
            game_skill_level: 10,
            membership: "esea",
            anticheat_required: true
          },
          {
            id: "bbcb7815-d382-4a5e-b8e4-533fe986e5d5",
            nickname: "sebasgamer11",
            avatar:
              "https://distribution.faceit-cdn.net/images/8971b84c-0a45-41b6-bb2b-e6c199b8a078.jpeg",
            game_id: "76561198355040827",
            game_name: "Seb",
            game_skill_level: 10,
            membership: "esea",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      },
      {
        id: "a128039e-1e53-4b66-bc8c-4d7a3c8853be",
        name: "begom",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/75dca2f3-b6ca-46ed-a412-416702a78e93.jpg",
        leader_id: "a593278e-00b4-4358-bd8c-5aac084f7107",
        co_leader_id: "",
        roster: [
          {
            id: "04801c5c-d737-430a-94d3-769fffb26d02",
            nickname: "Vortex666",
            avatar:
              "https://distribution.faceit-cdn.net/images/fc0bfc0d-fd86-43c2-829d-ae8d55e12b97.jpg",
            game_id: "76561198258949935",
            game_name: "Bizarre666",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "bc9ce63d-701e-4d3a-8f61-8801502c6957",
            nickname: "awayyy0",
            avatar:
              "https://distribution.faceit-cdn.net/images/b438314e-8a27-41cd-b613-3529f00ca266.jpg",
            game_id: "76561199480370932",
            game_name: "404 not found",
            game_skill_level: 10,
            membership: "esea,plus",
            anticheat_required: true
          },
          {
            id: "74ad32ec-50f6-4aca-93cc-bc895578347a",
            nickname: "FICADEQUATAO",
            avatar:
              "https://distribution.faceit-cdn.net/images/51e40377-524e-4154-9b29-e92fb483d363.jpg",
            game_id: "76561199095547839",
            game_name: "benz",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "a2d1215e-d01c-4522-983f-2449745d1be3",
            nickname: "BMWEnj0yer",
            avatar:
              "https://distribution.faceit-cdn.net/images/993f4fb2-ab85-416d-98cf-f8601fb284e8.jpg",
            game_id: "76561198171255109",
            game_name: "igra hyini",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          },
          {
            id: "e90dfd0c-67d7-4c1f-9758-6998b1004ea6",
            nickname: "facer",
            avatar:
              "https://distribution.faceit-cdn.net/images/1b6a3350-2d4f-4a0d-a494-5e21d53ce332.jpg",
            game_id: "76561198038564296",
            game_name: "facer",
            game_skill_level: 10,
            membership: "esea,plus",
            anticheat_required: true
          },
          {
            id: "a593278e-00b4-4358-bd8c-5aac084f7107",
            nickname: "relan",
            avatar:
              "https://distribution.faceit-cdn.net/images/1d2dab6b-fb16-48ff-a181-7263b3011ee8.jpg",
            game_id: "76561198795796854",
            game_name: "^^",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      }
    ],
    created_at: "2025-07-24T17:28:34Z",
    updated_at: "2025-07-26T01:05:18Z",
    started_at: "2025-07-26T00:25:51Z",
    finished_at: "2025-07-26T01:05:18Z"
  }
} satisfies MatchStatusFinishedWebhook;

// Test data for matchmaking match_status_ready
export const validWebhookPayloadMatchStatusReadyMatchmaking = {
  transaction_id: "cb893b14-5811-4f11-b309-e453cf9024fd",
  event_id: "340cc466-ff64-45bf-a7a3-dd69e5001123",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-27T01:54:51Z",
  retry_count: 0,
  version: 1,
  event: "match_status_ready",
  payload: {
    id: "1-matchmaking-ready-match-id",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "NA",
    game: "cs2",
    version: 71,
    entity: {
      id: "5227a49c-f172-485e-a19b-a666ddeb3140",
      name: "ESEA S54 NA Elite 1 Group D - Group Stage",
      type: "matchmaking"
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
} satisfies MatchStatusReadyWebhook;

// Test data for AFK abort case (startTime === "1970-01-01T00:00:00Z")
export const validWebhookPayloadMatchStatusFinishedAFKAbort = {
  transaction_id: "d7da69a4-4622-4faf-8efc-40ec7153cf40",
  event: "match_status_finished",
  event_id: "a86b09ad-622f-45b6-a708-fcaf9088bb69",
  third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
  app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
  timestamp: "2025-07-26T01:05:19Z",
  retry_count: 0,
  version: 1,
  payload: {
    id: "1-afk-abort-match-id",
    organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
    region: "NA",
    game: "cs2",
    version: 126,
    entity: {
      id: "ec39d65c-4069-4c0c-b2e1-5f957e7787f1",
      name: "ESEA S54 NA Elite 1 Group C - Group Stage",
      type: "championship"
    },
    teams: [
      {
        id: "d36ca2d0-d8f0-4c1d-9c1c-5b28cc58e532",
        name: "JERSA ESPORTS",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/6caffc2a-38bb-4437-9c28-4f5152aa3916.jpg",
        leader_id: "2afb9303-f70f-4d47-857c-ddc69e3da895",
        co_leader_id: "",
        roster: [
          {
            id: "fd27d75a-1f51-4abd-a4df-56eb5416776b",
            nickname: "BabyRage_S",
            avatar:
              "https://distribution.faceit-cdn.net/images/2a191b4e-cef5-4491-b757-759a48854c0b.jpeg",
            game_id: "76561198099461085",
            game_name: "4 burros conmigo 5 dxdx",
            game_skill_level: 10,
            membership: "esea",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      },
      {
        id: "a128039e-1e53-4b66-bc8c-4d7a3c8853be",
        name: "begom",
        type: "premade",
        avatar:
          "https://distribution.faceit-cdn.net/images/75dca2f3-b6ca-46ed-a412-416702a78e93.jpg",
        leader_id: "a593278e-00b4-4358-bd8c-5aac084f7107",
        co_leader_id: "",
        roster: [
          {
            id: "04801c5c-d737-430a-94d3-769fffb26d02",
            nickname: "Vortex666",
            avatar:
              "https://distribution.faceit-cdn.net/images/fc0bfc0d-fd86-43c2-829d-ae8d55e12b97.jpg",
            game_id: "76561198258949935",
            game_name: "Bizarre666",
            game_skill_level: 10,
            membership: "premium,esea",
            anticheat_required: true
          }
        ],
        substitutions: 0,
        substitutes: []
      }
    ],
    created_at: "2025-07-24T17:28:34Z",
    updated_at: "2025-07-26T01:05:18Z",
    started_at: "1970-01-01T00:00:00Z", // AFK abort indicator
    finished_at: "2025-07-26T01:05:18Z"
  }
} satisfies MatchStatusFinishedWebhook;

export const validWebhookPayloadMatchStatusReady = {
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
} satisfies MatchStatusReadyWebhook;

export const validWebhookPayloadObjectCreated = {
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
    game: "cs2" as FaceitGame,
    version: 1,
    entity: {
      id: "3eb11474-6211-4c99-b0f2-1f3e857ab6aa",
      name: "ESEA S54 EU Elite 1 Group D - Group Stage",
      type: "championship"
    },
    created_at: "2025-07-26T19:31:53Z",
    updated_at: "2025-07-26T19:31:53Z"
  }
} satisfies MatchObjectCreatedWebhook;

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

  describe("POST /webhook - championship_created", () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Organizer exists
      mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([mockOrganizer]);

      // Save webhook succeeds
      mockSaveWebhookData.mockResolvedValue({ insertId: 1 });

      // Championship details fetch is not needed for assertions; return empty object
      jest
        .spyOn(faceitServices, "getFaceITChampionshipDetails")
        .mockResolvedValue({} as unknown as Record<string, unknown>);

      // No active season exists -> service throws
      // Default: let service run; individual tests can override
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 400 when no active organizer season exists", async () => {
      // Inline minimal payload object (mirrors championship_created.json)
      const championshipCreated = {
        transaction_id: "45c6cb33-cb52-40ea-933d-9427034adcf0",
        event: "championship_created",
        event_id: "d23815bd-47f3-4e2a-ba4f-c2cf077054b5",
        third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
        app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
        timestamp: "2025-07-31T13:52:23Z",
        retry_count: 0,
        version: 1,
        payload: {
          id: "bf2c98d1-a163-4b8b-a49d-11b8e98046da",
          name: "5 Div S4 Lohko A",
          owner_id: "281c1ff6-35bf-44f0-bac3-9d6edb34e695",
          organizer_id: "d2372a88-623d-4ca3-9248-a480b6dfbe1a",
          game: "cs2",
          region: "EU",
          description: "",
          type: "roundRobin",
          status: "created",
          published: false,
          featured: false,
          archived: false,
          admin_tool_enabled: true,
          check_in_enabled: true,
          rulesId: "",
          slots: 16,
          total_rounds: 15,
          total_groups: 1,
          check_in_clear: "2025-08-07T13:52:00Z",
          check_in_start: "2025-08-07T13:22:00Z",
          subscription_end: "2025-08-07T14:22:00Z",
          subscription_start: "2025-07-31T14:22:00Z"
        }
      };

      // Force service to throw for this case
      jest
        .spyOn(seasonLeagueExternalIdServices, "addChampionshipToDatabase")
        .mockRejectedValueOnce(new Error("No active organizer season found"));

      const response = await request(app)
        .post("/api/v1/faceit/webhook")
        .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
        .send(championshipCreated);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "No active organizer season found"
      });

      // Saved with event and payload
      expect(mockSaveWebhookData).toHaveBeenCalledWith(
        championshipCreated.payload.id,
        "championship_created",
        championshipCreated,
        expect.any(Object)
      );

      // Service invoked with validated webhook
      expect(
        seasonLeagueExternalIdServices.addChampionshipToDatabase
      ).toHaveBeenCalled();
    });

    it("should call DB insert with correct league, stage and flags for roundRobin championship name '5 Div S4 Lohko A'", async () => {
      const championshipCreated = {
        transaction_id: "45c6cb33-cb52-40ea-933d-9427034adcf0",
        event: "championship_created",
        event_id: "d23815bd-47f3-4e2a-ba4f-c2cf077054b5",
        third_party_id: "8f1e3648-23d8-41e8-bf7e-d0d6308a31d0",
        app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
        timestamp: "2025-07-31T13:52:23Z",
        retry_count: 0,
        version: 1,
        payload: {
          id: "bf2c98d1-a163-4b8b-a49d-11b8e98046da",
          name: "5 Div S4 Lohko A",
          owner_id: "281c1ff6-35bf-44f0-bac3-9d6edb34e695",
          organizer_id: "d2372a88-623d-4ca3-9248-a480b6dfbe1a",
          game: "cs2",
          region: "EU",
          description: "",
          type: "roundRobin",
          status: "created",
          published: false,
          featured: false,
          archived: false,
          admin_tool_enabled: true,
          check_in_enabled: true,
          rulesId: "",
          slots: 16,
          total_rounds: 15,
          total_groups: 1,
          check_in_clear: "2025-08-07T13:52:00Z",
          check_in_start: "2025-08-07T13:22:00Z",
          subscription_end: "2025-08-07T14:22:00Z",
          subscription_start: "2025-07-31T14:22:00Z"
        }
      };

      // Active organizer season mocked
      mockGetOrganizerActiveSeasonForApp.mockResolvedValueOnce({
        id: 77
      } as unknown as Season);

      // Mock league resolution from faceit name prefix '5'
      mockGetSeasonLeagueBySeasonAndFaceitName.mockResolvedValueOnce({
        season_id: 77,
        league_id: 5,
        tier: 1
      } as unknown as SeasonLeague);

      // DB insert mock
      mockInsertSeasonLeagueExternalId.mockResolvedValueOnce({
        insertId: 1
      } as unknown as { insertId: number });

      // Avoid network for championship details fetch
      jest
        .spyOn(faceitServices, "getFaceITChampionshipDetails")
        .mockResolvedValue({} as unknown);

      const response = await request(app)
        .post("/api/v1/faceit/webhook")
        .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
        .send(championshipCreated);

      expect(response.status).toBe(200);

      // Should have looked up league by first token of name -> '5'
      expect(mockGetSeasonLeagueBySeasonAndFaceitName).toHaveBeenCalledWith(
        77,
        "5"
      );

      // Stage=1 (roundRobin), isBO2PlayedAs2xBO1=true
      expect(mockInsertSeasonLeagueExternalId).toHaveBeenCalledWith(
        "bf2c98d1-a163-4b8b-a49d-11b8e98046da",
        "5 Div S4 Lohko A",
        77,
        5,
        1,
        "roundRobin",
        true
      );
    });
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
          expect.any(Object)
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

  describe("POST /webhook - match_demo_ready", () => {
    describe("Success Cases", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockAddMatchGamesForMatch.mockResolvedValue(undefined);
        mockValidatePlayersInTeams.mockResolvedValue(undefined);
      });

      it("should successfully process championship match_demo_ready webhook", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookMatchDemoReady);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-ffb4225f-ff51-42ed-acb5-af6714175934",
          "match_demo_ready",
          validWebhookMatchDemoReady,
          validMatchDetailsMatchDemoReady
        );

        // Verify players were validated
        expect(mockValidatePlayersInTeams).toHaveBeenCalledWith(
          validMatchDetailsMatchDemoReady.teams,
          validMatchDetailsMatchDemoReady.match_id
        );

        // Verify match games were added for championship
        expect(mockAddMatchGamesForMatch).toHaveBeenCalledWith(
          validWebhookMatchDemoReady,
          validMatchDetailsMatchDemoReady,
          validWebhookMatchDemoReady.payload.entity.id
        );
      });
    });
  });

  describe("POST /webhook - match_status_finished", () => {
    describe("Success Cases", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockUpdateMatchStatus.mockResolvedValue(undefined);
        mockUpdateMatchFinished.mockResolvedValue(undefined);
      });

      it("should successfully process match_status_finished webhook", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadMatchStatusFinished);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-dba8981d-5647-466a-be32-12a06fb8fc31",
          "match_status_finished",
          validWebhookPayloadMatchStatusFinished,
          expect.any(Object)
        );

        // Verify match was updated with start and end times
        expect(mockUpdateMatchFinished).toHaveBeenCalledWith(
          "1-dba8981d-5647-466a-be32-12a06fb8fc31",
          "2025-07-26T00:25:51Z",
          "2025-07-26T01:05:18Z"
        );

        // Verify match status was updated to FINISHED
        expect(mockUpdateMatchStatus).toHaveBeenCalledWith(
          "1-dba8981d-5647-466a-be32-12a06fb8fc31",
          "FINISHED"
        );
      });

      it("should handle AFK abort case with updateMatchEndTime", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadMatchStatusFinishedAFKAbort);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-afk-abort-match-id",
          "match_status_finished",
          validWebhookPayloadMatchStatusFinishedAFKAbort,
          expect.any(Object)
        );

        // Verify updateMatchEndTime was called for AFK abort case
        expect(mockUpdateMatchEndTime).toHaveBeenCalledWith(
          "1-afk-abort-match-id",
          "2025-07-26T01:05:18Z"
        );

        // Verify match status was updated to FINISHED
        expect(mockUpdateMatchStatus).toHaveBeenCalledWith(
          "1-afk-abort-match-id",
          "ABORTED"
        );

        // Verify updateMatchFinished was NOT called (AFK abort case)
        expect(mockUpdateMatchFinished).not.toHaveBeenCalled();
      });
    });
  });

  describe("POST /webhook - match_status_ready matchmaking", () => {
    describe("Success Cases", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetOrganizerByFaceitIdAndGameAppId.mockResolvedValue([
          mockOrganizer
        ]);
        mockSaveWebhookData.mockResolvedValue({ insertId: 1 });
        mockUpdateMatchStatus.mockResolvedValue(undefined);
      });

      it("should successfully process matchmaking match_status_ready webhook", async () => {
        const response = await request(app)
          .post("/api/v1/faceit/webhook")
          .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
          .send(validWebhookPayloadMatchStatusReadyMatchmaking);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Webhook received");

        // Verify webhook data was saved
        expect(mockSaveWebhookData).toHaveBeenCalledWith(
          "1-matchmaking-ready-match-id",
          "match_status_ready",
          validWebhookPayloadMatchStatusReadyMatchmaking,
          expect.any(Object)
        );

        // Verify match status was updated to ONGOING for matchmaking
        expect(mockUpdateMatchStatus).toHaveBeenCalledWith(
          "1-matchmaking-ready-match-id",
          "ONGOING"
        );

        // Verify addMatchTeamMapVetoes was NOT called (matchmaking doesn't use it)
        expect(mockAddMatchTeamMapVetoes).not.toHaveBeenCalled();
      });
    });
  });
});
