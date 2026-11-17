import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

const backend = (process.env.NAVSIGHT_API_URL || "https://api.echlon.dev:20208/navsight-api").replace(/\/$/, "");
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const cookieName = process.env.NODE_ENV === "production" ? "__Host-navsight-session" : "navsight-session";
const postActions = ["activate", "download-ticket", "checkout", "recover", "register", "login", "logout", "password", "claim", "device-start", "device-info", "device-approve", "device-poll"];
const publicActions = ["catalog", "register", "login", "recover", "device-start", "device-info", "device-poll", "logout"];

async function relay(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if ((request.method === "GET" && !["status", "catalog", "account"].includes(action)) || (request.method === "POST" && !postActions.includes(action))) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }
  // Browser mutations require the exact origin. Native device requests use no cookies.
  const origin = request.headers.get("origin");
  const nativeDevice = ["device-start", "device-poll"].includes(action);
  if (request.method === "POST" && !nativeDevice && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Please reload this page and try again." }, { status: 403, headers });
  }
  const session = request.cookies.get(cookieName)?.value || "";
  const authorization = request.headers.get("authorization") || "";
  if (!publicActions.includes(action) && !session && !/^Bearer [A-Za-z0-9_-]{30,128}$/.test(authorization)) {
    return NextResponse.json({ error: "Please sign in to your account." }, { status: 401, headers });
  }
  try {
    if (Number(request.headers.get("content-length") || "0") > 4096) return NextResponse.json({ error: "Request too large" }, { status: 413, headers });
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 4096) return NextResponse.json({ error: "Request too large" }, { status: 413, headers });
    const peer = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown";
    const response = await fetch(`${backend}/${action}`, {
      method: request.method,
      headers: { Authorization: authorization, "Content-Type": "application/json", "X-NavSight-Session": nativeDevice ? "" : session,
        "X-NavSight-Client": createHash("sha256").update(peer.split(",")[0].trim()).digest("hex") },
      body, cache: "no-store", signal: AbortSignal.timeout(20_000), redirect: "error",
    });
    const result = await response.json();
    const newSession = result.session;
    delete result.session; // The browser's JavaScript never receives the authentication secret.
    const outgoing = NextResponse.json(result, { status: response.status, headers });
    if (response.ok && ["register", "login", "password"].includes(action) && /^[A-Za-z0-9_-]{30,128}$/.test(newSession || "")) {
      outgoing.cookies.set(cookieName, newSession, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
    }
    if (action === "logout" && response.ok) outgoing.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return outgoing;
  } catch {
    return NextResponse.json({ error: "The service is temporarily unavailable. Your purchase is saved; please try again shortly." }, { status: 503, headers });
  }
}

export const GET = relay;
export const POST = relay;
