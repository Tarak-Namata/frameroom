// Brute-force protection: 5 failures lock an identifier (login, gallery, setup code) for 15 minutes.
import { db } from "./db";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function isLocked(identifier: string) {
  const a = await db.loginAttempt.findUnique({ where: { identifier } });
  return !!a?.lockedUntil && a.lockedUntil > new Date();
}

export async function recordFailure(identifier: string) {
  const prev = await db.loginAttempt.findUnique({ where: { identifier } });
  const stale = prev && Date.now() - prev.updatedAt.getTime() > LOCK_MS;
  const a = await db.loginAttempt.upsert({
    where: { identifier },
    update: stale ? { count: 1 } : { count: { increment: 1 } },
    create: { identifier, count: 1 },
  });
  if (a.count >= MAX_ATTEMPTS) {
    await db.loginAttempt.update({ where: { identifier }, data: { count: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } });
  }
}

export async function clearFailures(identifier: string) {
  await db.loginAttempt.deleteMany({ where: { identifier } });
}
