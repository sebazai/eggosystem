import { envConfig } from "@/configs/env";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const urlParams = await params;
  const backendUrl = `${envConfig.API_URL}/api/v1/organizations/${urlParams.id}/teams`;

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
