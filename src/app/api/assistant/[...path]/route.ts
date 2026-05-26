import { NextRequest } from "next/server";
import { hasAssistantSession } from "../../assistant-auth";

const apiUrl = process.env.SPR_API_URL ?? "https://api.echlon.dev:20208";
const apiToken = process.env.SPR_API_TOKEN;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!await hasAssistantSession()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!apiToken) {
    return Response.json(
      { error: "SPR_API_TOKEN is not configured on the server." },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  const target = `${apiUrl.replace(/\/$/, "")}/${path.join("/")}${url.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  headers.set("authorization", `Bearer ${apiToken}`);
  headers.set("x-forwarded-host", request.headers.get("host") ?? url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  headers.set("x-forwarded-prefix", "/api/assistant");
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : Buffer.from(await request.arrayBuffer());

  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

