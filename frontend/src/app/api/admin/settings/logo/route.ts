import sharp from "sharp";
import { db, getSettings } from "@/lib/db";
import { fail, json, requireUser } from "@/lib/http";
import { ALLOWED_TYPES, randomId } from "@/lib/images";
import { storage } from "@/lib/storage";

export async function POST(req: Request) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File)) return fail("No logo uploaded");
  if (!ALLOWED_TYPES[file.type]) return fail("Logo must be JPEG, PNG or WebP");
  if (file.size > 5 * 1024 * 1024) return fail("Logo must be under 5 MB");
  const png = await sharp(Buffer.from(await file.arrayBuffer()))
    .resize(800, 400, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer()
    .catch(() => null);
  if (!png) return fail("Not a valid image");
  const old = await getSettings();
  const key = `branding/logo-${randomId(8)}.png`;
  await storage.put(key, png, "image/png");
  const s = await db.settings.update({ where: { id: 1 }, data: { logoKey: key } });
  if (old.logoKey) await storage.remove(old.logoKey).catch(() => {});
  return json(s);
}
