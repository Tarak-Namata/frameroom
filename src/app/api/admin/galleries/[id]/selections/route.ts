import { db } from "@/lib/db";
import { fail, json, requireUser } from "@/lib/http";
import { safe } from "@/lib/errors";

// Lists every client's selection for a gallery and marks submitted ones as seen.
export const GET = safe(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const g = await db.gallery.findUnique({ where: { id }, select: { id: true, slug: true, maxSelections: true } });
  if (!g) return fail("This gallery doesn't exist anymore.", 404);
  const selections = await db.selection.findMany({
    where: { galleryId: id },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    include: { items: { where: { OR: [{ hearted: true }, { comment: { not: null } }] }, include: { photo: { select: { id: true, filename: true, createdAt: true } } } } },
  });
  const now = new Date();
  await db.selection.updateMany({ where: { galleryId: id, status: "submitted", seenAt: null }, data: { seenAt: now } });
  return json({
    slug: g.slug,
    maxSelections: g.maxSelections,
    selections: selections.map((s) => ({
      id: s.id,
      clientName: s.clientName,
      clientEmail: s.clientEmail,
      status: s.status,
      submittedAt: s.submittedAt,
      unread: s.status === "submitted" && !s.seenAt,
      updatedAt: s.updatedAt,
      items: s.items
        .sort((a, b) => a.photo.createdAt.getTime() - b.photo.createdAt.getTime())
        .map((i) => ({ photoId: i.photoId, filename: i.photo.filename, hearted: i.hearted, comment: i.comment })),
    })),
  });
});
