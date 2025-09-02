import { insertClipProcessing } from "../models/allstar.models";
import { logger } from "../utils/app-logger";
import { getMatchGameClipForGameId } from "../models/match-game-clip.models";

interface AllStarClipRequest {
  demoUrl: string;
  webhookUrl: string;
  metadata?: Array<{
    key: string;
    value: string;
  }>;
}

interface AllStarClipResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}

export const sendDemoForAllStarPOTGClip = async (
  gameId: number,
  demoUrl: string
): Promise<AllStarClipResponse | undefined> => {
  const isAllStarDemoRequested = await getMatchGameClipForGameId(gameId);
  if (isAllStarDemoRequested.length > 0) {
    logger.info(
      `Demo processing request already exists for game ${gameId} with demo url ${demoUrl}`
    );
    return undefined;
  }
  const apiKey = process.env.ALLSTAR_API_KEY;
  if (!apiKey) {
    logger.error("ALLSTAR_API_KEY is not set");
    return {
      success: false,
      error: "ALLSTAR_API_KEY is not set"
    };
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    logger.error("BACKEND_URL is not set");
    return {
      success: false,
      error: "BACKEND_URL is not set"
    };
  }

  const webhookUrl = `${backendUrl}/api/v1/allstar/webhook`;

  // Prepare request data
  const requestData: AllStarClipRequest = {
    demoUrl,
    webhookUrl
  };

  requestData.metadata = [
    {
      key: "game_id",
      value: gameId.toString()
    }
  ];

  try {
    logger.info(
      `Sending clip request to AllStar.gg for gameId ${gameId} with demoUrl ${demoUrl} and webhookUrl ${webhookUrl}`
    );

    const response = await fetch("https://prt.allstar.gg/cs/clip/potg", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("AllStar API request failed", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        gameId
      });

      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        message: errorText
      };
    }

    const responseData = await response.json();

    logger.info(
      `AllStar clip request successful for game ${gameId} with response: ${JSON.stringify(
        responseData
      )}`
    );

    // Insert processing record
    try {
      await insertClipProcessing(gameId, "potg");
    } catch (dbError) {
      logger.error(
        `Failed to insert clip processing record for game ${gameId}`,
        dbError
      );
    }

    return {
      success: true,
      requestId: responseData.requestId,
      message: "Clip request submitted successfully"
    };
  } catch (error) {
    logger.error(
      `Error sending demo to AllStar for game ${gameId} with demoUrl ${demoUrl}`,
      error
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
