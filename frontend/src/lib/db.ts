// Prisma client (SQLite by default, Postgres when DATABASE_URL says so) and settings helpers.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_DB_URL } from "./config";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient({ datasourceUrl: process.env.DATABASE_URL || DEFAULT_DB_URL });
if (process.env.NODE_ENV !== "production") g.prisma = db;

export async function getSettings() {
  return db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

type S = Awaited<ReturnType<typeof getSettings>>;

// Strip encrypted secrets before sending settings to the browser.
export function publicSettings(s: S) {
  return {
    studioName: s.studioName,
    accentColor: s.accentColor,
    hasLogo: !!s.logoKey,
    appUrl: s.appUrl,
    email: { configured: !!(s.smtpHost && s.smtpFrom), host: s.smtpHost, port: s.smtpPort, secure: s.smtpSecure, user: s.smtpUser, from: s.smtpFrom, hasPassword: !!s.smtpPassEnc, bannerDismissed: s.emailBannerDismissed, lastError: s.lastEmailError, lastErrorAt: s.lastEmailErrorAt },
  };
}
