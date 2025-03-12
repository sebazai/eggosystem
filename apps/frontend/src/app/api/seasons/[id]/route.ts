import { envConfig } from "@/configs/env";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const response = await fetch(`${envConfig.API_URL}/api/v1/seasons/${id}`);

  if (response.status === 404) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch season" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
