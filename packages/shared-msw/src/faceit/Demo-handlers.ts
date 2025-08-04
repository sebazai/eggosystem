import { http, HttpResponse } from "msw";

export const faceitDemoHandlers = [
  // Demo download URL endpoint
  http.post(
    "https://open.faceit.com/download/v2/demos/download",
    async ({ request }) => {
      const body = (await request.json()) as { resource_url: string };
      const { resource_url } = body;

      // Return a valid demo download URL for any resource_url
      return HttpResponse.json({
        payload: {
          download_url:
            "https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-ffb4225f-ff51-42ed-acb5-af6714175934-1-1.dem.zst"
        }
      });
    }
  )
];
