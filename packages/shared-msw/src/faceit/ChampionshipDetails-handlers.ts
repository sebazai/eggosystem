import { http, HttpResponse } from "msw";

export const faceitChampionshipHandlers = [
  // Valid championship match details for the test match ID
  http.get(
    "https://open.faceit.com/data/v4/championships/:championship_id",
    ({ params }) => {
      const { championship_id } = params;
      return HttpResponse.json({ championship_id });
    }
  )
];
