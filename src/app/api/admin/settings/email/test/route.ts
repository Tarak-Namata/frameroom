import { db, getSettings } from "@/lib/db";
import { fail, json, requireUser } from "@/lib/http";
import { safe } from "@/lib/errors";
import { friendlySmtpError, sendTestEmail } from "@/lib/email";
import { clearFailures, isLocked, recordFailure } from "@/lib/ratelimit";

export const POST = safe(async () => {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  if (await isLocked("smtp-test")) return fail("Too many test emails in a row. Please wait 15 minutes and try again.", 429);
  const s = await getSettings();
  try {
    await sendTestEmail(s, user!.email, s.studioName);
    await clearFailures("smtp-test");
    await db.settings.update({ where: { id: 1 }, data: { lastEmailError: null, lastEmailErrorAt: null } });
    return json({ ok: true, message: `Test email sent to ${user!.email}. Check your inbox (and spam folder).` });
  } catch (e) {
    await recordFailure("smtp-test");
    console.error("[frameroom] SMTP test failed:", (e as { code?: string })?.code || e);
    return fail(friendlySmtpError(e), 422);
  }
});
