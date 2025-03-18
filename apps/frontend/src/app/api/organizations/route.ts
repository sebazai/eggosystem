import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/configs/env";

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q");
  const backendUrl = searchQuery
    ? `${envConfig.API_URL}/api/v1/organizations?q=${searchQuery}`
    : `${envConfig.API_URL}/api/v1/organizations`;

  const response = await fetch(backendUrl);

  if (!response.ok) {
    throw NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
