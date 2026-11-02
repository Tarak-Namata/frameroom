import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(DATA_DIR, "uploads"));
export const DEFAULT_DB_URL = `file:${path.join(DATA_DIR, "frameroom.db")}`;

let secret: string | undefined;

// Uses SESSION_SECRET if provided, otherwise a random secret persisted in the data folder.
export function sessionSecret() {
  if (secret) return secret;
  if (process.env.SESSION_SECRET) return (secret = process.env.SESSION_SECRET);
  const file = path.join(DATA_DIR, ".session-secret");
  if (!existsSync(file)) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(file, randomBytes(48).toString("hex"), { mode: 0o600, flag: "wx" });
  }
  return (secret = readFileSync(file, "utf8").trim());
}

export function publicBaseUrl(storedAppUrl: string | null | undefined, req?: Request) {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (storedAppUrl) return storedAppUrl.replace(/\/+$/, "");
  return req ? requestOrigin(req) : "";
}

export function requestOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = (req.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  return host ? `${proto}://${host.split(",")[0].trim()}` : new URL(req.url).origin;
}
