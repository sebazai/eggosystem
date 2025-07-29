import { insertClipProcessing } from "../models/allstar.models";
import { logger } from "../utils/app-logger";

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
  demoUrl: string,
  gameId: number
): Promise<AllStarClipResponse> => {
  const apiKey = process.env.ALLSTAR_API_KEY;
  if (!apiKey) {
    throw new Error("ALLSTAR_API_KEY is not set");
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not set");
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
    logger.info("Sending clip request to AllStar.gg", {
      demoUrl,
      webhookUrl,
      gameId
    });

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

    logger.info("AllStar clip request successful", {
      gameId,
      responseData
    });

    // Insert processing record
    await insertClipProcessing(gameId, "potg");

    return {
      success: true,
      requestId: responseData.requestId,
      message: "Clip request submitted successfully"
    };
  } catch (error) {
    logger.error("Error sending demo to AllStar", {
      error: error instanceof Error ? error.message : String(error),
      gameId,
      demoUrl
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
