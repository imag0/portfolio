import { NextRequest } from "next/server";
import { hasAssistantSession } from "../assistant-auth";

const apiUrl = process.env.SPR_API_URL ?? "https://api.echlon.dev:20208";
const apiToken = process.env.SPR_API_TOKEN;

export async function POST(request: NextRequest) {
  if (!await hasAssistantSession()) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!apiToken) {
    return Response.json({ error: "SPR_API_TOKEN is not configured on the server." }, { status: 500 });
  }

  const body = await request.json();
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/upload-ticket`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
