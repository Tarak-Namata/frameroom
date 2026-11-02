import { timingSafeEqual } from "node:crypto";
import { db, getSettings } from "@/lib/db";
import { hasOwner, hashPassword, startSession } from "@/lib/auth";
import { fail, json, readJson, str } from "@/lib/http";
import { requestOrigin } from "@/lib/config";
import { safe } from "@/lib/errors";
import { clearFailures, isLocked, recordFailure } from "@/lib/ratelimit";

const CODE_KEY = "setup-code";
const codeRequired = () => !!process.env.SETUP_CODE?.trim();

function codeMatches(input: string) {
  const a = Buffer.from(input.trim());
  const b = Buffer.from(process.env.SETUP_CODE!.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export const GET = safe(async () => json({ setupComplete: await hasOwner(), codeRequired: codeRequired() }));

export const POST = safe(async (req: Request) => {
  if (await hasOwner()) return fail("Your studio is already set up. Please sign in instead.", 403);
  const b = await readJson<{ name: string; email: string; password: string; studioName: string; setupCode: string; checkOnly: boolean }>(req);
  if (codeRequired()) {
    if (await isLocked(CODE_KEY)) return fail("Too many wrong setup codes. Please wait 15 minutes and try again.", 429);
    if (!codeMatches(typeof b.setupCode === "string" ? b.setupCode : "")) {
      await recordFailure(CODE_KEY);
      return fail("That setup code isn't right. You'll find it in your hosting panel's environment settings (SETUP_CODE).", 401);
    }
    await clearFailures(CODE_KEY);
  }
  if (b.checkOnly) return json({ ok: true });
  const name = str(b.name, 100);
  const email = str(b.email, 200).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  if (!name) return fail("Please enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email address, like you@studio.com.");
  if (password.length < 8) return fail("Please choose a password with at least 8 characters.");
  // Keep an existing studio name (e.g. from demo mode) unless the owner typed one.
  const existing = await getSettings();
  const studioName = str(b.studioName, 100) || (existing.studioName !== "My Studio" ? existing.studioName : `${name} Photography`);
  try {
    // Fixed id: a second concurrent setup fails on the primary key, so only one owner can ever exist.
    await db.user.create({ data: { id: "owner", name, email, passwordHash: await hashPassword(password) } });
  } catch {
    return fail("Your studio is already set up. Please sign in instead.", 403);
  }
  const appUrl = process.env.APP_URL ? null : requestOrigin(req);
  await db.settings.upsert({ where: { id: 1 }, update: { studioName, appUrl }, create: { id: 1, studioName, appUrl } });
  await startSession("owner");
  return json({ id: "owner", email, name }, 201);
});
