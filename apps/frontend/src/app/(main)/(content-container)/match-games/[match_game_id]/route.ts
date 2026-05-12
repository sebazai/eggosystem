import { NextResponse } from "next/server";
import { envConfig } from "@/configs/env";

interface MatchIdResponse {
  match_id: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ match_game_id: string }> }
) {
  const { match_game_id } = await params;
  const matchGameId = parseInt(match_game_id, 10);

  // Validate match_game_id is a valid number
  if (isNaN(matchGameId)) {
    return NextResponse.json(
      { error: "Invalid match_game_id" },
      { status: 404 }
    );
  }

  // Fetch match_id from the API
  try {
    const res = await fetch(
      `${envConfig.API_URL}/api/v1/match-games/${matchGameId}/match`,
      {
        cache: "no-store" // Ensure fresh data for redirects
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const data: MatchIdResponse = await res.json();

    if (!data.match_id) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Build redirect URL from public base (not request.url, which may be internal host in production)
    const path =
      `${envConfig.BASE_PATH}/matches/${data.match_id}/games/${matchGameId}`.replace(
        /\/+/g,
        "/"
      );
    const redirectUrl = new URL(path, envConfig.BASE_URL);

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (_error) {
    // If API call fails, return 404
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 404 }
    );
  }
}
