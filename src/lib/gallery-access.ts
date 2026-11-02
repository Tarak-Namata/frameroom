// Who may view a gallery: anyone with the link, plus a signed cookie when it is password-protected.
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { getUser } from "./auth";
import { sign, verify } from "./session";

const TTL = 60 * 60 * 24 * 30;
export const accessCookie = (galleryId: string) => `fr_ga_${galleryId}`;
const fingerprint = (hash: string) => createHash("sha256").update(hash).digest("hex").slice(0, 16);

export async function accessToken(galleryId: string, passwordHash: string) {
  return { name: accessCookie(galleryId), value: await sign({ gid: galleryId, fp: fingerprint(passwordHash) }, TTL), maxAge: TTL };
}

export async function getGalleryBySlug(slug: string) {
  return db.gallery.findUnique({ where: { slug }, include: { client: true } });
}

type G = NonNullable<Awaited<ReturnType<typeof getGalleryBySlug>>>;

export async function canView(gallery: G) {
  if (!gallery.passwordHash) return true;
  const token = (await cookies()).get(accessCookie(gallery.id))?.value;
  const p = await verify<{ gid: string; fp: string }>(token);
  if (p && p.gid === gallery.id && p.fp === fingerprint(gallery.passwordHash)) return true;
  return !!(await getUser());
}
