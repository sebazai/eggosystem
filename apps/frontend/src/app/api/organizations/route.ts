import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q");

  const response = await fetch(
    `${envConfig.API_URL}/api/v1/organizations${searchQuery ? "?q=${searchQuery}" : ""}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
