import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  // Change the filters there
  const response = await fetch(
    `${envConfig.API_URL}/api/v1/matches/seasons/14/leagues/any/teams/any/stages/any/maps/any`
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
