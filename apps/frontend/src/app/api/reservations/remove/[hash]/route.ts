import { envConfig } from "@/configs/env";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  const backendRes = await fetch(
    `${envConfig.API_URL}/api/v1/reservations/remove/${encodeURIComponent(hash)}`,
    { method: "POST", cache: "no-store" }
  );

  const contentType = backendRes.headers.get("content-type");
  const bodyText = await backendRes.text();

  return new NextResponse(bodyText, {
    status: backendRes.status,
    headers: contentType ? { "content-type": contentType } : undefined
  });
}
