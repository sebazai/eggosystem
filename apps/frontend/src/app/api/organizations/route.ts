import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q");

  const buildUrl = new URL(envConfig.API_URL);
  buildUrl.pathname = "/api/v1/organizations";
  if (searchQuery) {
    buildUrl.searchParams.set("q", searchQuery);
  }

  const response = await fetch(buildUrl);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
