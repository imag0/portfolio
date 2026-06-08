import { NextRequest, NextResponse } from "next/server";

const RELAY_URL = (process.env.MORSE_RELAY_INTERNAL_URL || "https://api.echlon.dev:20208/morse-api").replace(/\/$/, "");

function relayError(status = 502) {
  return NextResponse.json({ error: "morse_relay_unavailable" }, { status });
}

export async function GET(request: NextRequest) {
  const after = request.nextUrl.searchParams.get("after") || "0";
  const limit = request.nextUrl.searchParams.get("limit") || "80";

  try {
    const response = await fetch(`${RELAY_URL}/messages?after=${encodeURIComponent(after)}&limit=${encodeURIComponent(limit)}`, {
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return relayError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetch(`${RELAY_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return relayError();
  }
}
