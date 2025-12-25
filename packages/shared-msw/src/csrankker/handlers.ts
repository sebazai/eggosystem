import { http, HttpResponse } from "msw";
import {
  csrankkerValidSteamId,
  csrankkerNotFoundSteamId,
  csrankkerNetworkErrorSteamId,
  csrankkerInvalidJsonSteamId,
  csrankkerHighKanaEloSteamId,
  csrankkerMediumKanaEloSteamId,
  csrankkerLowKanaEloSteamId
} from "./test-ids.js";

export const csrankkerHandlers = [
  http.get(
    "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
    ({ params }) => {
      const { steamId } = params;

      if (steamId === csrankkerValidSteamId) {
        return HttpResponse.json({
          status: "success",
          result: {
            steamId: steamId,
            seasonId: 999,
            originalKanaelo: 1800,
            stabilizedKanaelo: 1800,
            stabilizationInfo: {
              confidence: 0.8,
              adjustmentFactor: 0.1,
              method: "bayesian"
            },
            components: {
              trueLevel: 1200,
              mm: 100,
              hour: 200,
              kana: 100
            },
            calculus: "formula",
            timestamp: "2023-01-01T00:00:00Z"
          }
        });
      }

      if (steamId === csrankkerNotFoundSteamId) {
        return new HttpResponse("Player not found", { status: 404 });
      }

      if (steamId === csrankkerNetworkErrorSteamId) {
        return HttpResponse.error();
      }

      if (steamId === csrankkerInvalidJsonSteamId) {
        return HttpResponse.text("Invalid JSON");
      }

      if (steamId === csrankkerHighKanaEloSteamId) {
        return HttpResponse.json({
          status: "success",
          result: {
            steamId: steamId,
            seasonId: 14,
            originalKanaelo: 2000,
            stabilizedKanaelo: 2000,
            stabilizationInfo: {
              confidence: 0.8,
              adjustmentFactor: 0.1,
              method: "bayesian"
            },
            components: {
              trueLevel: 1200,
              mm: 100,
              hour: 200,
              kana: 100
            },
            calculus: "formula",
            timestamp: "2023-01-01T00:00:00Z"
          }
        });
      }

      if (steamId === csrankkerMediumKanaEloSteamId) {
        return HttpResponse.json({
          status: "success",
          result: {
            steamId: steamId,
            seasonId: 14,
            originalKanaelo: 1500,
            stabilizedKanaelo: 1600,
            stabilizationInfo: {
              confidence: 0.8,
              adjustmentFactor: 0.1,
              method: "bayesian"
            },
            components: {
              trueLevel: 1200,
              mm: 100,
              hour: 200,
              kana: 100
            },
            calculus: "formula",
            timestamp: "2023-01-01T00:00:00Z"
          }
        });
      }

      if (steamId === csrankkerLowKanaEloSteamId) {
        return HttpResponse.json({
          status: "success",
          result: {
            steamId: steamId,
            seasonId: 15,
            originalKanaelo: 250,
            stabilizedKanaelo: 240,
            stabilizationInfo: {
              confidence: 0.8,
              adjustmentFactor: 0.96,
              method: "kanarating-stabilization"
            },
            components: {
              trueLevel: 100,
              mm: 80,
              hour: 20,
              kana: 40
            },
            calculus: "100 + 80 + 20 + 40",
            timestamp: "2025-07-15T22:11:17.792Z"
          }
        });
      }

      // Default case - return a valid response for any other steam ID
      return HttpResponse.json({
        status: "success",
        result: {
          steamId: steamId,
          seasonId: 999,
          originalKanaelo: 1600,
          stabilizedKanaelo: 1600,
          stabilizationInfo: {
            confidence: 0.8,
            adjustmentFactor: 0.1,
            method: "bayesian"
          },
          components: {
            trueLevel: 1000,
            mm: 100,
            hour: 200,
            kana: 100
          },
          calculus: "formula",
          timestamp: "2023-01-01T00:00:00Z"
        }
      });
    }
  )
];
