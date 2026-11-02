import { checkPassword, cookieOpts } from "@/lib/auth";
import { cookies } from "next/headers";
import { fail, json, readJson } from "@/lib/http";
import { accessToken, getGalleryBySlug } from "@/lib/gallery-access";
import { clearFailures, isLocked, recordFailure } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGalleryBySlug(slug);
  if (!g) return fail("Gallery not found", 404);
  if (!g.passwordHash) return json({ ok: true });
  const id = `gallery:${g.id}`;
  if (await isLocked(id)) return fail("Too many wrong passwords. Please wait 15 minutes, or ask your photographer for help.", 429);
  const { password } = await readJson<{ password: string }>(req);
  if (typeof password !== "string" || !(await checkPassword(password, g.passwordHash))) {
    await recordFailure(id);
    return fail("That password isn't right. Check the message from your photographer and try again.", 401);
  }
  await clearFailures(id);
  const t = await accessToken(g.id, g.passwordHash);
  (await cookies()).set(t.name, t.value, await cookieOpts(t.maxAge));
  return json({ ok: true });
}
