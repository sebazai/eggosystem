import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get("season") || "14";
  const stage = searchParams.get("stage") || "any";
  const map = searchParams.get("map") || "any";

  const response = await fetch(
    `${envConfig.API_URL}/api/v1/matches/seasons/${season}/leagues/any/teams/any/stages/${stage}/maps/${map}`
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
