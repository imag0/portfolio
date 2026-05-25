import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookie = "spr_assistant_session";
const maxAgeSeconds = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ASSISTANT_SESSION_SECRET ?? process.env.SPR_API_TOKEN ?? "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionValue() {
  const issuedAt = String(Date.now());
  return `${issuedAt}.${sign(issuedAt)}`;
}

export async function setAssistantSession() {
  const jar = await cookies();
  jar.set(sessionCookie, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function hasAssistantSession() {
  const currentSecret = secret();
  if (!currentSecret) return false;
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeSeconds * 1000) return false;
  const expected = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
