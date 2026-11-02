import { db, getSettings } from "@/lib/db";
import { publicBaseUrl } from "@/lib/config";
import { hashPassword } from "@/lib/auth";
import { fail, json, readJson, requireUser, str } from "@/lib/http";
import { storage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const g = await db.gallery.findUnique({
    where: { id },
    include: { client: true, photos: { orderBy: { createdAt: "asc" }, select: { id: true, filename: true, width: true, height: true, size: true } } },
  });
  if (!g) return fail("This gallery doesn't exist anymore.", 404);
  const { passwordHash, ...rest } = g;
  const base = publicBaseUrl((await getSettings()).appUrl, req);
  const unread = await db.selection.count({ where: { galleryId: g.id, status: "submitted", seenAt: null } });
  return json({ ...rest, hasPassword: !!passwordHash, shareUrl: `${base}/g/${g.slug}`, unread });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  if (!(await db.gallery.findUnique({ where: { id } }))) return fail("Gallery not found", 404);
  const b = await readJson<{ title: string; clientId: string | null; password: string | null; maxSelections: number | string | null }>(req);
  const data: { title?: string; clientId?: string | null; passwordHash?: string | null; maxSelections?: number | null } = {};
  if (b.maxSelections !== undefined) {
    const n = b.maxSelections === null || b.maxSelections === "" ? null : Number(b.maxSelections);
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 10000)) return fail("Max selections should be a whole number like 30, or leave it empty for no limit.");
    data.maxSelections = n;
  }
  if (b.title !== undefined) {
    data.title = str(b.title, 160);
    if (!data.title) return fail("Title is required");
  }
  if (b.clientId !== undefined) {
    data.clientId = str(b.clientId, 64) || null;
    if (data.clientId && !(await db.client.findUnique({ where: { id: data.clientId } }))) return fail("Client not found", 404);
  }
  if (b.password === null || b.password === "") data.passwordHash = null;
  else if (typeof b.password === "string") {
    if (b.password.length < 4) return fail("Password must be at least 4 characters");
    data.passwordHash = await hashPassword(b.password);
  }
  const g = await db.gallery.update({ where: { id }, data });
  return json({ id: g.id, title: g.title, clientId: g.clientId, hasPassword: !!g.passwordHash, maxSelections: g.maxSelections });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const photos = await db.photo.findMany({ where: { galleryId: id } });
  await db.gallery.deleteMany({ where: { id } });
  await Promise.allSettled(photos.flatMap((p) => [p.originalKey, p.largeKey, p.thumbKey].map((k) => storage.remove(k))));
  return json({ ok: true });
}
