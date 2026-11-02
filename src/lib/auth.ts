// Owner authentication: bcrypt password hashing and the signed session cookie.
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_TTL, sign, verify } from "./session";

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function isSecureRequest() {
  const h = await headers();
  return (h.get("x-forwarded-proto") || "").split(",")[0].trim() === "https";
}

export async function cookieOpts(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: await isSecureRequest(), path: "/", maxAge };
}

export async function startSession(userId: string) {
  const token = await sign({ sub: userId, type: "session" }, SESSION_TTL);
  (await cookies()).set(SESSION_COOKIE, token, await cookieOpts(SESSION_TTL));
}

export async function getUser() {
  const payload = await verify<{ sub: string; type: string }>((await cookies()).get(SESSION_COOKIE)?.value);
  if (!payload || payload.type !== "session") return null;
  return db.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
}

export async function hasOwner() {
  return (await db.user.count()) > 0;
}
