import { db, getSettings } from "@/lib/db";
import { json, requireUser } from "@/lib/http";
import { safe } from "@/lib/errors";

export const POST = safe(async () => {
  const { denied } = await requireUser();
  if (denied) return denied;
  await getSettings();
  await db.settings.update({ where: { id: 1 }, data: { emailBannerDismissed: true } });
  return json({ ok: true });
});
