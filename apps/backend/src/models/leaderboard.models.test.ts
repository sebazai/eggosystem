import { getLeaderboard } from "./leaderboards.models";

describe("getLeaderboard", () => {
  it("kanarating for team 1650", async () => {
    const result = await getLeaderboard({
      leaderboards: "kana_rating",
      season_ids: null,
      league_ids: null,
      stages: null,
      team_ids: [1650],
      map_ids: null
    });
    expect(result).toEqual({
      kana_rating: [
        {
          steam_id: "76561198049745649",
          nickname: "sububobi",
          team_name: "7dos",
          team_logo: "cf9838e7641c3333",
          matches_played: 13,
          kana_rating: 1.03
        },
        {
          steam_id: "76561197963921578",
          nickname: "van9",
          team_name: "7dos",
          team_logo: "cf9838e7641c3333",
          matches_played: 17,
          kana_rating: 0.897059
        },
        {
          steam_id: "76561198001857963",
          nickname: "meppi",
          team_name: "7dos",
          team_logo: "cf9838e7641c3333",
          matches_played: 17,
          kana_rating: 0.847647
        },
        {
          steam_id: "76561197967885016",
          nickname: "enzoj",
          team_name: "7dos",
          team_logo: "cf9838e7641c3333",
          matches_played: 17,
          kana_rating: 0.823529
        },
        {
          steam_id: "76561198030886203",
          nickname: "defektro",
          team_name: "7dos",
          team_logo: "cf9838e7641c3333",
          matches_played: 17,
          kana_rating: 0.608235
        }
      ]
    });
  });
  it("deaths in season 14", async () => {
    const result = await getLeaderboard({
      leaderboards: "deaths",
      season_ids: [14],
      league_ids: null,
      stages: null,
      team_ids: null,
      map_ids: null
    });
    expect(result).toEqual({
      deaths: [
        {
          steam_id: "76561198437815468",
          nickname: "HuputonRosvo",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 26,
          deaths: 439
        },
        {
          steam_id: "76561197979955992",
          nickname: "tiMMyd",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 26,
          deaths: 436
        },
        {
          steam_id: "76561198282583074",
          nickname: "Pepso",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 26,
          deaths: 433
        },
        {
          steam_id: "76561198015168566",
          nickname: "gigajaska",
          team_name: "Prove Testaa",
          team_logo: "d4e1eb9694192b36",
          matches_played: 26,
          deaths: 392
        },
        {
          steam_id: "76561197973115783",
          nickname: "HERRAHEVONEN",
          team_name: "Prove Testaa",
          team_logo: "d4e1eb9694192b36",
          matches_played: 25,
          deaths: 385
        }
      ]
    });
  });
  it("kast in season 14, masters, regular, anubis", async () => {
    const result = await getLeaderboard({
      leaderboards: "kast",
      season_ids: [14],
      league_ids: [1],
      stages: [1],
      team_ids: null,
      map_ids: [9]
    });
    expect(result).toEqual({
      kast: [
        {
          steam_id: "76561198437815468",
          nickname: "HuputonRosvo",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 3,
          kast: 83
        },
        {
          steam_id: "76561198113913968",
          nickname: "Danon1no",
          team_name: "Futurice",
          team_logo: "c0f23a0fc5f27a0d",
          matches_played: 3,
          kast: 81
        },
        {
          steam_id: "76561198119062598",
          nickname: "paBlo=D",
          team_name: "Elisa Hosujat",
          team_logo: "bbb1c44e3ab1b10e",
          matches_played: 3,
          kast: 80.6667
        },
        {
          steam_id: "76561198367129350",
          nickname: "Gee",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 3,
          kast: 78.6667
        },
        {
          steam_id: "76561198282583074",
          nickname: "Pepso",
          team_name: "Evitec Esports",
          team_logo: "d4e1eb9694192b36",
          matches_played: 3,
          kast: 78
        }
      ]
    });
  });
});
