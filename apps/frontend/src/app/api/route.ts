import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello, world!" }, { status: 200 });
}
