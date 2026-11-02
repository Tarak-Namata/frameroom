import { db } from "@/lib/db";
import { checkPassword, startSession } from "@/lib/auth";
import { fail, json, readJson, str } from "@/lib/http";
import { clearFailures, isLocked, recordFailure } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const b = await readJson<{ email: string; password: string }>(req);
  const email = str(b.email, 200).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const id = `login:${email}`;
  if (!email || !password) return fail("Please enter your email and password.");
  if (await isLocked(id)) return fail("Too many sign-in attempts. For your security, please wait 15 minutes and try again.", 429);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    await recordFailure(id);
    return fail("That email and password don't match. Please try again.", 401);
  }
  await clearFailures(id);
  await startSession(user.id);
  return json({ id: user.id, email: user.email, name: user.name });
}
