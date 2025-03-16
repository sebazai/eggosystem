import { envConfig } from "@/configs/env";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ steamid: string }> }
) {
  const player = await params;
  const backendUrl = `${envConfig.API_URL}/api/v1/players/${player.steamid}`;

  const response = await fetch(backendUrl);

  if (!response.ok) {
    throw NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
