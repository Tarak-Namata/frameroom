import { db } from "@/lib/db";
import { json, requireUser } from "@/lib/http";
import { safe } from "@/lib/errors";

// Unread = submitted selections the photographer hasn't opened yet.
export const GET = safe(async () => {
  const { denied } = await requireUser();
  if (denied) return denied;
  const rows = await db.selection.findMany({
    where: { status: "submitted", seenAt: null },
    orderBy: { submittedAt: "desc" },
    include: { gallery: { select: { id: true, title: true } }, _count: { select: { items: { where: { hearted: true } } } } },
  });
  return json(rows.map((r) => ({ id: r.id, galleryId: r.gallery.id, galleryTitle: r.gallery.title, clientName: r.clientName, submittedAt: r.submittedAt, count: r._count.items })));
});
