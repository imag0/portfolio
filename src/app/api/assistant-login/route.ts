import { NextRequest } from "next/server";
import { setAssistantSession } from "../assistant-auth";

const apiUrl = process.env.SPR_API_URL ?? "http://yasmin208.mikrus.xyz:20208";
const apiToken = process.env.SPR_API_TOKEN;
const assistantUser = process.env.ASSISTANT_USER ?? "ayomi";
const assistantPassword = process.env.ASSISTANT_PASSWORD ?? apiToken;

export async function POST(request: NextRequest) {
  if (!assistantPassword || !apiToken) {
    return Response.json({ error: "Assistant login is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({})) as { username?: string; password?: string };
  if (body.username !== assistantUser || body.password !== assistantPassword) {
    return Response.json({ error: "Nieprawidłowe hasło." }, { status: 401 });
  }

  const health = await fetch(`${apiUrl.replace(/\/$/, "")}/health`, {
    cache: "no-store",
  });

  if (!health.ok) {
    return Response.json({ error: "VPS nie odpowiada." }, { status: 502 });
  }

  await setAssistantSession();
  return Response.json({ ok: true });
}
