import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the backend URL from environment or use default
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/v1/teams/faceit-links`, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Faceit links:", error);
    return NextResponse.json(
      { error: "Failed to fetch Faceit links" },
      { status: 500 }
    );
  }
}
