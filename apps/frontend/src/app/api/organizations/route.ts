import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../configs/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  const response = await fetch(`${envConfig.API_URL}/api/v1/organizations`);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
