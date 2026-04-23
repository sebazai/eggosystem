import { envConfig } from "@/configs/env";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const bodyText = await request.text();

  const backendRes = await fetch(
    `${envConfig.API_URL}/api/v1/reservations/remove`,
    {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: bodyText
    }
  );

  const contentType = backendRes.headers.get("content-type");
  const backendBodyText = await backendRes.text();

  return new NextResponse(backendBodyText, {
    status: backendRes.status,
    headers: contentType ? { "content-type": contentType } : undefined
  });
}
