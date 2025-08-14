import { http, HttpResponse } from "msw";

export const csrankkerKanaeloHandler = [
  http.get("https://csrankker.kanaliiga.fi/api/v1/kanaelo/:player", () => {
    //Defaul success response CS2
    return HttpResponse.json({});
  })
];
