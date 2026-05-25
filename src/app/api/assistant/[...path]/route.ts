import { NextRequest } from "next/server";
import { hasAssistantSession } from "../../assistant-auth";

const apiUrl = process.env.SPR_API_URL ?? "http://yasmin208.mikrus.xyz:20208";
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
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("authorization", `Bearer ${apiToken}`);
  headers.set("x-forwarded-host", request.headers.get("host") ?? url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  headers.set("x-forwarded-prefix", "/api/assistant");

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

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

