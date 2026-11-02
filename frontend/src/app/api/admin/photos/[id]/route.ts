import { db } from "@/lib/db";
import { json, requireUser } from "@/lib/http";
import { storage } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const p = await db.photo.findUnique({ where: { id } });
  if (p) {
    await db.photo.delete({ where: { id } });
    await Promise.allSettled([p.originalKey, p.largeKey, p.thumbKey].map((k) => storage.remove(k)));
  }
  return json({ ok: true });
}
