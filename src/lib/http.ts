// Small helpers shared by API routes: JSON responses, auth guard, safe body parsing.
import { NextResponse } from "next/server";
import { getUser } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function requireUser() {
  const user = await getUser();
  return user ? { user, denied: null } : { user: null, denied: fail("Not authenticated", 401) };
}

export async function readJson<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
