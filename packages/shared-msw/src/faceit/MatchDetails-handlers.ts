import {
  ChampionshipDetailsDemoReady,
  ChampionshipDetailsFinished,
  ChampionshipDetailsObjectCreated,
  ChampionshipDetailsReady,
  FaceitGame,
  FaceitMatchStatus,
  MatchStatus
} from "@eggosystem/types";
import { http, HttpResponse } from "msw";

export const validMatchDetailsMatchDemoReady = {
  match_id: "1-ffb4225f-ff51-42ed-acb5-af6714175934",
  version: 2,
  game: FaceitGame.CS2,
  region: "EU",
  competition_id: "2a40fbe5-f71b-471e-b25d-7837c1b441bc",
  competition_type: "championship",
  competition_name: "ESEA S54 EU Elite 1 Group B - Group Stage",
  organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
  teams: {
    faction1: {
      faction_id: "f0eb455e-aadf-4029-9dea-b7806612e668",
      leader: "b59b2cea-9cb2-4650-982e-0fece5d1aaf6",
      avatar:
        "https://distribution.faceit-cdn.net/images/6d64c744-7377-4022-a478-edef98402281.jpg",
      roster: [
        {
          player_id: "b59b2cea-9cb2-4650-982e-0fece5d1aaf6",
          nickname: "7oX1C",
          avatar:
            "https://distribution.faceit-cdn.net/images/0b5fbccd-b37d-40b0-b5b0-6e25a6cd87e7.jpg",
          membership: "premium",
          game_player_id: "76561198312729649",
          game_player_name: "7oX1C",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "95371621-2dc2-4ae2-8633-e70c1f754d25",
          nickname: "kiy0o",
          avatar:
            "https://distribution.faceit-cdn.net/images/6468ba66-f70f-4900-aa7b-d1137495e94f.jpg",
          membership: "esea",
          game_player_id: "76561199017580923",
          game_player_name: "i'm back reboot",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "e55d08cc-a951-42db-9b2c-4fd3e41732ce",
          nickname: "smekk-",
          avatar:
            "https://distribution.faceit-cdn.net/images/5058303a-850d-4a46-9658-ff942252dd2f.jpeg",
          membership: "esea",
          game_player_id: "76561198060923015",
          game_player_name: "ala de sub mine e prost",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "e3b1690b-c52a-4ba3-93b3-9878ddede3f7",
          nickname: "Shieldx",
          avatar:
            "https://assets.faceit-cdn.net/avatars/e3b1690b-c52a-4ba3-93b3-9878ddede3f7_1586901804791.jpg",
          membership: "esea",
          game_player_id: "76561198253891911",
          game_player_name: "bobby fischer",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "e84bf029-00a2-4b7e-b3ec-4e58f786acd7",
          nickname: "-delle",
          avatar:
            "https://distribution.faceit-cdn.net/images/ce5c5183-a63c-4227-b14c-0b63ad437546.jpeg",
          membership: "premium",
          game_player_id: "76561197972819559",
          game_player_name: "-delle",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "SKYFURY",
      type: "premade"
    },
    faction2: {
      faction_id: "ecc58df2-7ee1-46d7-a370-3c389b7d355f",
      leader: "82ed91b3-2d07-4740-949c-6f5b5e99b33b",
      avatar:
        "https://distribution.faceit-cdn.net/images/9fcf1838-545b-4b60-9ac8-f194b75480de.jpeg",
      roster: [
        {
          player_id: "82ed91b3-2d07-4740-949c-6f5b5e99b33b",
          nickname: "mac10only-",
          avatar:
            "https://distribution.faceit-cdn.net/images/108df4f3-4109-43a4-a747-fac20d4712ff.jpeg",
          membership: "esea",
          game_player_id: "76561199036285926",
          game_player_name: "gost",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "6c8cb1e8-726a-42aa-9b64-486b1ef68a56",
          nickname: "re1gn999",
          avatar:
            "https://distribution.faceit-cdn.net/images/20bd9982-c24d-4024-9b11-6f343106f1a4.jpg",
          membership: "premium",
          game_player_id: "76561198946151017",
          game_player_name: "Flash Baron",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "75b7d8c4-e346-492c-adef-a91fffeb3886",
          nickname: "z1k4-",
          avatar:
            "https://distribution.faceit-cdn.net/images/45077340-e9d4-4e0d-81b8-495af471378b.jpeg",
          membership: "esea",
          game_player_id: "76561198156774221",
          game_player_name: "payk52",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "37a13cea-9f8b-45d3-9886-40faf2506d69",
          nickname: "m1QUSE272",
          avatar:
            "https://distribution.faceit-cdn.net/images/492fe7e4-f682-4132-b255-e697995ce60d.jpeg",
          membership: "premium",
          game_player_id: "76561198832142602",
          game_player_name: "m1",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "53bcb68e-bca1-40de-8ec8-b0df14c51d04",
          nickname: "tonyblack-",
          avatar:
            "https://assets.faceit-cdn.net/avatars/53bcb68e-bca1-40de-8ec8-b0df14c51d04_1550488509052.png",
          membership: "premium",
          game_player_id: "76561197976004330",
          game_player_name: "MENYATUTNET",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "09013eac-138e-47ca-a38f-2ba9021c975f",
          nickname: "flouzer",
          avatar:
            "https://distribution.faceit-cdn.net/images/88ea680e-ea5b-437f-86bc-cf8f898949b2.jpeg",
          membership: "premium",
          game_player_id: "76561199181360085",
          game_player_name: "los3treak enjoyer",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "Nuclear TigeRES",
      type: "premade"
    }
  },
  voting: {
    voted_entity_types: ["location", "map"],
    location: {
      entities: [
        {
          name: "Moscow",
          class_name: "Moscow",
          game_location_id: "Moscow",
          guid: "Moscow",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/ru.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/ru.jpg?width=110&height=55"
        },
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/nl.jpg?width=110&height=55",
          name: "Netherlands",
          class_name: "Netherlands",
          game_location_id: "Netherlands",
          guid: "Netherlands",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/nl.jpg?width=428&height=212"
        },
        {
          class_name: "UK",
          game_location_id: "UK",
          guid: "UK",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/uk.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/uk.jpg?width=110&height=55",
          name: "UK"
        },
        {
          game_location_id: "Germany",
          guid: "Germany",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/de.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/de.jpg?width=110&height=55",
          name: "Germany",
          class_name: "Germany"
        },
        {
          class_name: "Sweden",
          game_location_id: "Sweden",
          guid: "Sweden",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/se.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/se.jpg?width=110&height=55",
          name: "Sweden"
        },
        {
          class_name: "France",
          game_location_id: "France",
          guid: "France",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/fr.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/fr.jpg?width=110&height=55",
          name: "France"
        },
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/fi.jpg?width=110&height=55",
          name: "Finland",
          class_name: "Finland",
          game_location_id: "Finland",
          guid: "Finland",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/fi.jpg?width=428&height=212"
        },
        {
          class_name: "Poland",
          game_location_id: "Poland",
          guid: "Poland",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/pl.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/pl.jpg?width=110&height=55",
          name: "Poland"
        }
      ],
      pick: ["Poland"]
    },
    map: {
      entities: [
        {
          class_name: "de_dust2",
          game_map_id: "de_dust2",
          guid: "de_dust2",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7c17caa9-64a6-4496-8a0b-885e0f038d79_1695819126962.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/adf58ac6-b0f3-40e9-87ef-0af23fc60918_1695819116078.jpeg",
          name: "Dust2"
        },
        {
          guid: "de_mirage",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7fb7d725-e44d-4e3c-b557-e1d19b260ab8_1695819144685.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/796b5b23-41e4-4387-a4a9-0d28c1c57456_1695819136505.jpeg",
          name: "Mirage",
          class_name: "de_mirage",
          game_map_id: "de_mirage"
        },
        {
          class_name: "de_nuke",
          game_map_id: "de_nuke",
          guid: "de_nuke",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7197a969-81e4-4fef-8764-55f46c7cec6e_1695819158849.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/15ff938d-a70d-4d0b-9bf9-6be215cdb193_1695819151395.jpeg",
          name: "Nuke"
        },
        {
          name: "Overpass",
          class_name: "de_overpass",
          game_map_id: "de_overpass",
          guid: "de_overpass",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/058c4eb3-dac4-441c-a810-70afa0f3022c_1695819170133.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/6d7e8e7f-f136-49f3-a4ca-a9afffbe8022_1695819165013.jpeg"
        },
        {
          name: "Ancient",
          class_name: "de_ancient",
          game_map_id: "de_ancient",
          guid: "de_ancient",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/5b844241-5b15-45bf-a304-ad6df63b5ce5_1695819190976.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a7d193ca-9498-4546-bf7b-da33e3e429a5_1695819186093.jpeg"
        },
        {
          game_map_id: "de_train",
          guid: "de_train",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/225a54ad-c66d-46ee-8ae1-2e4159691ee9_1731582334484.png",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/3efe2d1d-da1b-4960-a439-daf216f77bb4_1731582328687.png",
          name: "Train",
          class_name: "de_train"
        },
        {
          name: "Inferno",
          class_name: "de_inferno",
          game_map_id: "de_inferno",
          guid: "de_inferno",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/993380de-bb5b-4aa1-ada9-a0c1741dc475_1695819220797.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a2cb95be-1a3f-49f3-a5fa-a02503d02086_1695819214782.jpeg"
        }
      ],
      pick: ["de_inferno", "de_ancient", "de_mirage"]
    }
  },
  calculate_elo: false,
  scheduled_at: 1753542000,
  configured_at: 1753547979,
  started_at: 1753548669,
  finished_at: 1753551038,
  demo_url: [
    "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst",
    "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-2-1.dem.zst",
    "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-3-1.dem.zst"
  ],
  chat_room_id: "match-1-ffb4225f-ff51-42ed-acb5-af6714175934",
  best_of: 3,
  results: {
    winner: "faction1",
    score: { faction1: 2, faction2: 1 }
  },
  detailed_results: [
    {
      asc_score: false,
      winner: "faction1",
      factions: { faction1: { score: 1 }, faction2: { score: 0 } }
    },
    {
      asc_score: false,
      winner: "faction2",
      factions: { faction1: { score: 0 }, faction2: { score: 1 } }
    },
    {
      asc_score: false,
      winner: "faction1",
      factions: { faction1: { score: 1 }, faction2: { score: 0 } }
    }
  ],
  status: FaceitMatchStatus.FINISHED,
  round: 1,
  group: 1,
  faceit_url:
    "https://www.faceit.com/{lang}/cs2/room/1-ffb4225f-ff51-42ed-acb5-af6714175934"
} satisfies ChampionshipDetailsDemoReady;

export const validMatchDetailsMatchStatusFinished = {
  match_id: "1-dba8981d-5647-466a-be32-12a06fb8fc31",
  version: 2,
  game: FaceitGame.CS2,
  region: "NA",
  competition_id: "ec39d65c-4069-4c0c-b2e1-5f957e7787f1",
  competition_type: "championship",
  competition_name: "ESEA S54 NA Elite 1 Group C - Group Stage",
  organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
  teams: {
    faction2: {
      faction_id: "a128039e-1e53-4b66-bc8c-4d7a3c8853be",
      leader: "a593278e-00b4-4358-bd8c-5aac084f7107",
      avatar:
        "https://distribution.faceit-cdn.net/images/75dca2f3-b6ca-46ed-a412-416702a78e93.jpg",
      roster: [
        {
          player_id: "a593278e-00b4-4358-bd8c-5aac084f7107",
          nickname: "relan",
          avatar:
            "https://distribution.faceit-cdn.net/images/1d2dab6b-fb16-48ff-a181-7263b3011ee8.jpg",
          membership: "premium",
          game_player_id: "76561198795796854",
          game_player_name: "^^",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "04801c5c-d737-430a-94d3-769fffb26d02",
          nickname: "Vortex666",
          avatar:
            "https://distribution.faceit-cdn.net/images/fc0bfc0d-fd86-43c2-829d-ae8d55e12b97.jpg",
          membership: "premium",
          game_player_id: "76561198258949935",
          game_player_name: "Bizarre666",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "bc9ce63d-701e-4d3a-8f61-8801502c6957",
          nickname: "awayyy0",
          avatar:
            "https://distribution.faceit-cdn.net/images/b438314e-8a27-41cd-b613-3529f00ca266.jpg",
          membership: "esea",
          game_player_id: "76561199480370932",
          game_player_name: "404 not found",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "74ad32ec-50f6-4aca-93cc-bc895578347a",
          nickname: "FICADEQUATAO",
          avatar:
            "https://distribution.faceit-cdn.net/images/51e40377-524e-4154-9b29-e92fb483d363.jpg",
          membership: "premium",
          game_player_id: "76561199095547839",
          game_player_name: "benz",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "a2d1215e-d01c-4522-983f-2449745d1be3",
          nickname: "BMWEnj0yer",
          avatar:
            "https://distribution.faceit-cdn.net/images/993f4fb2-ab85-416d-98cf-f8601fb284e8.jpg",
          membership: "premium",
          game_player_id: "76561198171255109",
          game_player_name: "igra hyini",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "e90dfd0c-67d7-4c1f-9758-6998b1004ea6",
          nickname: "facer",
          avatar:
            "https://distribution.faceit-cdn.net/images/1b6a3350-2d4f-4a0d-a494-5e21d53ce332.jpg",
          membership: "esea",
          game_player_id: "76561198038564296",
          game_player_name: "facer",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "begom",
      type: "premade"
    },
    faction1: {
      faction_id: "d36ca2d0-d8f0-4c1d-9c1c-5b28cc58e532",
      leader: "2afb9303-f70f-4d47-857c-ddc69e3da895",
      avatar:
        "https://distribution.faceit-cdn.net/images/6caffc2a-38bb-4437-9c28-4f5152aa3916.jpg",
      roster: [
        {
          player_id: "2afb9303-f70f-4d47-857c-ddc69e3da895",
          nickname: "1AYALA",
          avatar:
            "https://distribution.faceit-cdn.net/images/d6a1ff8e-4afd-4f66-a253-db792dbd5833.jpg",
          membership: "esea",
          game_player_id: "76561198953646715",
          game_player_name: "nodeal27",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "fd27d75a-1f51-4abd-a4df-56eb5416776b",
          nickname: "BabyRage_S",
          avatar:
            "https://distribution.faceit-cdn.net/images/2a191b4e-cef5-4491-b757-759a48854c0b.jpeg",
          membership: "esea",
          game_player_id: "76561198099461085",
          game_player_name: "4 burros conmigo 5 dxdx",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "c2e283d5-5803-4be3-abb6-1ded6e9ff5cd",
          nickname: "zockie",
          avatar:
            "https://assets.faceit-cdn.net/avatars/c2e283d5-5803-4be3-abb6-1ded6e9ff5cd_1550612021861.jpg",
          membership: "esea",
          game_player_id: "76561198067615374",
          game_player_name: "zockie",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "27e9176b-f524-42c2-bb89-a70cbcb78103",
          nickname: "Kuu",
          avatar:
            "https://distribution.faceit-cdn.net/images/5164be54-6bf7-458c-aeab-f14491fcab0d.jpeg",
          membership: "premium",
          game_player_id: "76561198255290780",
          game_player_name: "Speed#",
          game_skill_level: 9,
          anticheat_required: true
        },
        {
          player_id: "fff8b7eb-ed82-406a-b869-d44a88bf7eaa",
          nickname: "Slayerh-",
          avatar:
            "https://distribution.faceit-cdn.net/images/48dc8c01-dc4b-4378-a171-ae64ad16d175.jpeg",
          membership: "esea",
          game_player_id: "76561198277725019",
          game_player_name: "Slayerh",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "bbcb7815-d382-4a5e-b8e4-533fe986e5d5",
          nickname: "sebasgamer11",
          avatar:
            "https://distribution.faceit-cdn.net/images/8971b84c-0a45-41b6-bb2b-e6c199b8a078.jpeg",
          membership: "esea",
          game_player_id: "76561198355040827",
          game_player_name: "Seb",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "JERSA ESPORTS",
      type: "premade"
    }
  },
  voting: {
    voted_entity_types: ["location", "map"],
    location: {
      entities: [
        {
          guid: "Chicago",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Chicago",
          class_name: "Chicago",
          game_location_id: "Chicago"
        },
        {
          class_name: "Denver",
          game_location_id: "Denver",
          guid: "Denver",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Denver"
        },
        {
          game_location_id: "Dallas",
          guid: "Dallas",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Dallas",
          class_name: "Dallas"
        },
        {
          guid: "ESEA-NewYork",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212",
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "ESEA-NewYork",
          class_name: "ESEA-NewYork",
          game_location_id: "ESEA-NewYork"
        }
      ],
      pick: ["ESEA-NewYork"]
    },
    map: {
      entities: [
        {
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7c17caa9-64a6-4496-8a0b-885e0f038d79_1695819126962.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/adf58ac6-b0f3-40e9-87ef-0af23fc60918_1695819116078.jpeg",
          name: "Dust2",
          class_name: "de_dust2",
          game_map_id: "de_dust2",
          guid: "de_dust2"
        },
        {
          class_name: "de_mirage",
          game_map_id: "de_mirage",
          guid: "de_mirage",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7fb7d725-e44d-4e3c-b557-e1d19b260ab8_1695819144685.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/796b5b23-41e4-4387-a4a9-0d28c1c57456_1695819136505.jpeg",
          name: "Mirage"
        },
        {
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7197a969-81e4-4fef-8764-55f46c7cec6e_1695819158849.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/15ff938d-a70d-4d0b-9bf9-6be215cdb193_1695819151395.jpeg",
          name: "Nuke",
          class_name: "de_nuke",
          game_map_id: "de_nuke",
          guid: "de_nuke"
        },
        {
          guid: "de_overpass",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/058c4eb3-dac4-441c-a810-70afa0f3022c_1695819170133.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/6d7e8e7f-f136-49f3-a4ca-a9afffbe8022_1695819165013.jpeg",
          name: "Overpass",
          class_name: "de_overpass",
          game_map_id: "de_overpass"
        },
        {
          class_name: "de_ancient",
          game_map_id: "de_ancient",
          guid: "de_ancient",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/5b844241-5b15-45bf-a304-ad6df63b5ce5_1695819190976.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a7d193ca-9498-4546-bf7b-da33e3e429a5_1695819186093.jpeg",
          name: "Ancient"
        },
        {
          game_map_id: "de_train",
          guid: "de_train",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/225a54ad-c66d-46ee-8ae1-2e4159691ee9_1731582334484.png",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/3efe2d1d-da1b-4960-a439-daf216f77bb4_1731582328687.png",
          name: "Train",
          class_name: "de_train"
        },
        {
          name: "Inferno",
          class_name: "de_inferno",
          game_map_id: "de_inferno",
          guid: "de_inferno",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/993380de-bb5b-4aa1-ada9-a0c1741dc475_1695819220797.jpeg",
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a2cb95be-1a3f-49f3-a5fa-a02503d02086_1695819214782.jpeg"
        }
      ],
      pick: ["de_train", "de_mirage", "de_overpass"]
    }
  },
  calculate_elo: false,
  scheduled_at: 1753484400,
  configured_at: 1753489224,
  started_at: 1753489551,
  finished_at: 1753491918,
  demo_url: [
    "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-dba8981d-5647-466a-be32-12a06fb8fc31-1-1.dem.zst",
    "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-dba8981d-5647-466a-be32-12a06fb8fc31-2-1.dem.zst",
    "https://demos-us-east.backblaze.faceit-cdn.net/cs2/1-dba8981d-5647-466a-be32-12a06fb8fc31-3-1.dem.zst"
  ],
  chat_room_id: "match-1-dba8981d-5647-466a-be32-12a06fb8fc31",
  best_of: 3,
  results: {
    winner: "faction1",
    score: { faction1: 2, faction2: 1 }
  },
  detailed_results: [
    {
      asc_score: false,
      winner: "faction1",
      factions: { faction1: { score: 1 }, faction2: { score: 0 } }
    },
    {
      asc_score: false,
      winner: "faction2",
      factions: { faction2: { score: 1 }, faction1: { score: 0 } }
    },
    {
      asc_score: false,
      winner: "faction1",
      factions: { faction1: { score: 1 }, faction2: { score: 0 } }
    }
  ],
  status: MatchStatus.FINISHED,
  round: 1,
  group: 1,
  faceit_url:
    "https://www.faceit.com/{lang}/cs2/room/1-dba8981d-5647-466a-be32-12a06fb8fc31"
} satisfies ChampionshipDetailsFinished;

export const validMatchDetailsMatchStatusReady = {
  match_id: "1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191",
  version: 2,
  game: FaceitGame.CS2,
  region: "NA",
  competition_id: "5227a49c-f172-485e-a19b-a666ddeb3140",
  competition_name: "ESEA S54 NA Elite 1 Group D - Group Stage",
  organizer_id: "08b06cfc-74d0-454b-9a51-feda4b6b18da",
  voting: {
    map: {
      pick: ["de_dust2", "de_ancient", "de_train"],
      entities: [
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/adf58ac6-b0f3-40e9-87ef-0af23fc60918_1695819116078.jpeg",
          name: "Dust2",
          class_name: "de_dust2",
          game_map_id: "de_dust2",
          guid: "de_dust2",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7c17caa9-64a6-4496-8a0b-885e0f038d79_1695819126962.jpeg"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/796b5b23-41e4-4387-a4a9-0d28c1c57456_1695819136505.jpeg",
          name: "Mirage",
          class_name: "de_mirage",
          game_map_id: "de_mirage",
          guid: "de_mirage",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7fb7d725-e44d-4e3c-b557-e1d19b260ab8_1695819144685.jpeg"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/15ff938d-a70d-4d0b-9bf9-6be215cdb193_1695819151395.jpeg",
          name: "Nuke",
          class_name: "de_nuke",
          game_map_id: "de_nuke",
          guid: "de_nuke",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/7197a969-81e4-4fef-8764-55f46c7cec6e_1695819158849.jpeg"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/6d7e8e7f-f136-49f3-a4ca-a9afffbe8022_1695819165013.jpeg",
          name: "Overpass",
          class_name: "de_overpass",
          game_map_id: "de_overpass",
          guid: "de_overpass",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/058c4eb3-dac4-441c-a810-70afa0f3022c_1695819170133.jpeg"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a7d193ca-9498-4546-bf7b-da33e3e429a5_1695819186093.jpeg",
          name: "Ancient",
          class_name: "de_ancient",
          game_map_id: "de_ancient",
          guid: "de_ancient",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/5b844241-5b15-45bf-a304-ad6df63b5ce5_1695819190976.jpeg"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/3efe2d1d-da1b-4960-a439-daf216f77bb4_1731582328687.png",
          name: "Train",
          class_name: "de_train",
          game_map_id: "de_train",
          guid: "de_train",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/225a54ad-c66d-46ee-8ae1-2e4159691ee9_1731582334484.png"
        },
        {
          image_sm:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/a2cb95be-1a3f-49f3-a5fa-a02503d02086_1695819214782.jpeg",
          name: "Inferno",
          class_name: "de_inferno",
          game_map_id: "de_inferno",
          guid: "de_inferno",
          image_lg:
            "https://assets.faceit-cdn.net/third_party/games/ce652bd4-0abb-4c90-9936-1133965ca38b/assets/votables/993380de-bb5b-4aa1-ada9-a0c1741dc475_1695819220797.jpeg"
        }
      ]
    },
    voted_entity_types: ["location", "map"],
    location: {
      pick: ["Chicago"],
      entities: [
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Chicago",
          class_name: "Chicago",
          game_location_id: "Chicago",
          guid: "Chicago",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212"
        },
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Denver",
          class_name: "Denver",
          game_location_id: "Denver",
          guid: "Denver",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212"
        },
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "Dallas",
          class_name: "Dallas",
          game_location_id: "Dallas",
          guid: "Dallas",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212"
        },
        {
          image_sm:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=110&height=55",
          name: "ESEA-NewYork",
          class_name: "ESEA-NewYork",
          game_location_id: "ESEA-NewYork",
          guid: "ESEA-NewYork",
          image_lg:
            "https://distribution.faceit-cdn.net/images/flags/v1/us.jpg?width=428&height=212"
        }
      ]
    }
  },
  teams: {
    faction1: {
      faction_id: "3523360c-7235-452a-b9d9-e587e97ba4b5",
      leader: "6d10dac4-b0cf-473d-b5a8-a34c53aefade",
      avatar:
        "https://distribution.faceit-cdn.net/images/46f36e02-b08e-49be-b021-2ec50aebc8aa.jpg",
      roster: [
        {
          player_id: "6d10dac4-b0cf-473d-b5a8-a34c53aefade",
          nickname: "sasha",
          avatar:
            "https://distribution.faceit-cdn.net/images/d593c4f7-efbf-42fd-b2dd-c8c8d5f4a7c8.jpg",
          membership: "premium",
          game_player_id: "76561198140847869",
          game_player_name: "sasha",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "c7b709f5-281b-4133-859e-0d545c4c58d0",
          nickname: "Halen",
          avatar:
            "https://distribution.faceit-cdn.net/images/ed8de75a-007a-429a-99bc-13b450b2ba9b.jpg",
          membership: "esea",
          game_player_id: "76561198060497750",
          game_player_name: "Halen",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "01950e33-89f8-40f1-8839-db3771ddd136",
          nickname: "Zucar",
          avatar:
            "https://distribution.faceit-cdn.net/images/5685fa36-559e-4c1a-ab8a-3ea2d4eddae8.jpg",
          membership: "premium",
          game_player_id: "76561198119331267",
          game_player_name: "zucc",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "da7422ec-e62a-4df2-87fd-5f3c29f478b7",
          nickname: "1dvrk",
          avatar:
            "https://distribution.faceit-cdn.net/images/fa429887-8bb2-4ada-a876-1c5e46444b8f.jpeg",
          membership: "premium",
          game_player_id: "76561198358249075",
          game_player_name: "Donnie Dvrko",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "f10486e8-6197-4bbc-928d-5060e7be9657",
          nickname: "fuzenko",
          avatar:
            "https://distribution.faceit-cdn.net/images/6c56bdb1-b04c-4d12-aece-9374539f6eca.jpg",
          membership: "esea",
          game_player_id: "76561198929253202",
          game_player_name: ")",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "regain",
      type: "premade"
    },
    faction2: {
      faction_id: "ea5e1a5f-3d95-419e-b926-0c39e8c3d8dd",
      leader: "dcea95af-d945-426c-9b22-3bb3b8fb5441",
      avatar:
        "https://distribution.faceit-cdn.net/images/f0a92fc2-c0ab-47a2-b7ff-ee855b0960b5.jpeg",
      roster: [
        {
          player_id: "dcea95af-d945-426c-9b22-3bb3b8fb5441",
          nickname: "ayaneuu",
          avatar:
            "https://distribution.faceit-cdn.net/images/c6dbf67b-48aa-4239-bc6b-afa3d59ff112.jpg",
          membership: "premium",
          game_player_id: "76561198341370795",
          game_player_name: "ayaneuu",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "2c8adfac-5565-49a2-b835-a336360cddab",
          nickname: "Seb",
          avatar:
            "https://distribution.faceit-cdn.net/images/21d7e215-9f0e-4764-a82d-41842f19fdaa.jpeg",
          membership: "premium",
          game_player_id: "76561198215815481",
          game_player_name: "Seb",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "1c8f885a-3d9a-4d64-801f-68a336a745ea",
          nickname: "Sanzh1k33",
          avatar:
            "https://distribution.faceit-cdn.net/images/3ce7bb54-6e9a-4594-9eac-128a19f48fdc.jpg",
          membership: "premium",
          game_player_id: "76561199243647648",
          game_player_name: "76561199243647648",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "7627713e-9dfe-40e7-9d9d-ae8244aeb150",
          nickname: "asYLum",
          avatar:
            "https://distribution.faceit-cdn.net/images/7b261219-a46a-42b1-a015-d05a3262b0ba.jpeg",
          membership: "premium",
          game_player_id: "76561198138820397",
          game_player_name: "sk8er",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "b934fa1f-79ac-4410-84cd-06a6eca64423",
          nickname: "aelor",
          avatar:
            "https://distribution.faceit-cdn.net/images/d786937e-0934-4ac4-8445-e0486a9969be.jpeg",
          membership: "premium",
          game_player_id: "76561198231092204",
          game_player_name: "aelor",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "bc7cd9c2-0b37-47c6-9b19-4ccd90c63f44",
          nickname: "sathsea",
          avatar:
            "https://distribution.faceit-cdn.net/images/06c6c62e-05ce-4bf2-8962-9a177e6b1755.jpg",
          membership: "premium",
          game_player_id: "76561198401647782",
          game_player_name: "󠀡󠀡",
          game_skill_level: 10,
          anticheat_required: true
        },
        {
          player_id: "04924ee1-65bf-4424-b4d2-f82657133f53",
          nickname: "traekS",
          avatar:
            "https://distribution.faceit-cdn.net/images/b5b3d76f-d794-49db-8601-b0d7418e7b50.jpeg",
          membership: "premium",
          game_player_id: "76561198057008814",
          game_player_name: "traekS",
          game_skill_level: 10,
          anticheat_required: true
        }
      ],
      substituted: false,
      name: "Zomblers",
      type: "premade"
    }
  },
  calculate_elo: false,
  chat_room_id: "match-1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191",
  best_of: 3,
  status: FaceitMatchStatus.READY,
  faceit_url:
    "https://www.faceit.com/{lang}/cs2/room/1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191",
  configured_at: 1753581291,
  competition_type: "championship",
  round: 1,
  group: 1
} satisfies ChampionshipDetailsReady;

export const validMatchDetailsMatchCreated = {
  status: FaceitMatchStatus.SCHEDULED,
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
  game: FaceitGame.CS2,
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
} satisfies ChampionshipDetailsObjectCreated;

export const faceitMatchDetailsHandlers = [
  // Valid championship match details for the test match ID
  http.get(
    "https://open.faceit.com/data/v4/matches/:match_id",
    ({ params }) => {
      const { match_id } = params;

      if (match_id === "1-ffb4225f-ff51-42ed-acb5-af6714175934") {
        return HttpResponse.json(validMatchDetailsMatchDemoReady);
      }

      if (match_id === "1-dba8981d-5647-466a-be32-12a06fb8fc31") {
        return HttpResponse.json(validMatchDetailsMatchStatusFinished);
      }

      if (match_id === "1-32a13dfb-e5e7-4b0e-89ef-ab952e6d8191") {
        return HttpResponse.json(validMatchDetailsMatchStatusReady);
      }

      // Return valid championship match details for the test match ID
      if (match_id === "1-9dd7f430-3bfa-42e9-84cd-1fb455d05978") {
        return HttpResponse.json(validMatchDetailsMatchCreated);
      }

      // Invalid match details for testing validation errors
      if (match_id === "invalid-match-id") {
        return HttpResponse.json({
          invalid: "data",
          missing_required_fields: true
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
