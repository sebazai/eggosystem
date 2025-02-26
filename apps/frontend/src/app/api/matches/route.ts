import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season") || "14";
  const stage = searchParams.get("stage") || "any";
  const map = searchParams.get("map") || "any";

  const response = await fetch(
    `${envConfig.API_URL}/api/v1/matches/recent?season_ids[]=${season}&stages[]=${stage}&map_ids[]=${map}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
