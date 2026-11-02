// Signs and verifies JWTs (HS256) with the auto-generated or configured session secret.
import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "./config";

export const SESSION_COOKIE = "fr_session";
export const SESSION_TTL = 60 * 60 * 24 * 7;

const key = () => new TextEncoder().encode(sessionSecret());

export async function sign(payload: Record<string, unknown>, ttlSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key());
}

export async function verify<T = Record<string, unknown>>(token?: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as T;
  } catch {
    return null;
  }
}
