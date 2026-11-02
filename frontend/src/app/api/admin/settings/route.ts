import { db, getSettings, publicSettings } from "@/lib/db";
import { fail, json, readJson, requireUser, str } from "@/lib/http";
import { safe } from "@/lib/errors";
import { storage } from "@/lib/storage";

export const GET = safe(async () => {
  const { denied } = await requireUser();
  if (denied) return denied;
  return json({ ...publicSettings(await getSettings()), appUrlFromEnv: process.env.APP_URL || null });
});

export const PATCH = safe(async (req: Request) => {
  const { denied } = await requireUser();
  if (denied) return denied;
  const b = await readJson<{ studioName: string; accentColor: string; removeLogo: boolean; appUrl: string }>(req);
  const old = await getSettings();
  const data: { studioName?: string; accentColor?: string; logoKey?: null; appUrl?: string | null } = {};
  if (b.studioName !== undefined) {
    data.studioName = str(b.studioName, 100);
    if (!data.studioName) return fail("Please enter a studio name.");
  }
  if (b.accentColor !== undefined) {
    data.accentColor = str(b.accentColor, 7);
    if (!/^#[0-9a-fA-F]{6}$/.test(data.accentColor)) return fail("Please pick a color, or enter a hex code like #C85A32.");
  }
  if (b.appUrl !== undefined) {
    const url = str(b.appUrl, 300).replace(/\/+$/, "");
    if (url && !/^https?:\/\/[^\s/]+/.test(url)) return fail("Please enter the full address, starting with https://");
    data.appUrl = url || null;
  }
  if (b.removeLogo) data.logoKey = null;
  const s = await db.settings.update({ where: { id: 1 }, data });
  if (b.removeLogo && old.logoKey) await storage.remove(old.logoKey).catch(() => {});
  return json(publicSettings(s));
});
