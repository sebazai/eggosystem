import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

export async function GET(_request: NextRequest) {
  const response = await fetch(`${envConfig.API_URL}/api/v1/leagues`);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch leagues" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
