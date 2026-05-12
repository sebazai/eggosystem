import { http, HttpResponse } from "msw";

/**
 * Mock FACEIT democracy match history API (map veto data).
 * Used by addMatchTeamMapVetoes in backend; required for match_status_ready and match_demo_ready flows in integration tests.
 */
const matchHistoryPayload = {
  payload: {
    match_id: "1-f55c14a9-b708-4abc-8ffb-be4993e469c1",
    tickets: [
      {
        entity_type: "map",
        vote_type: "drop_pick",
        entities: [
          {
            guid: "3070290240",
            status: "pick",
            random: false,
            round: 1,
            selected_by: "faction1"
          },
          {
            guid: "3414036782",
            status: "pick",
            random: false,
            round: 2,
            selected_by: "faction2"
          }
        ]
      }
    ]
  }
};

export const faceitMatchHistoryHandlers = [
  http.get("https://www.faceit.com/api/democracy/v1/match/**/history", () =>
    HttpResponse.json(matchHistoryPayload)
  )
];
