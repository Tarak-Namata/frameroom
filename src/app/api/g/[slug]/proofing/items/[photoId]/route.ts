import { db } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { safe } from "@/lib/errors";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { getMySelection, heartCount } from "@/lib/proofing";

type Ctx = { params: Promise<{ slug: string; photoId: string }> };

export const PUT = safe(async (req: Request, { params }: Ctx) => {
  const { slug, photoId } = await params;
  const g = await getGalleryBySlug(slug);
  if (!g || !(await canView(g))) return fail("This gallery isn't available.", 404);
  const sel = await getMySelection(g.id);
  if (!sel) return fail("Please tell us your name and email first.", 401);
  if (sel.status === "submitted") return fail("You've already submitted your selections. Ask your photographer to reopen them if you'd like to make changes.", 409);
  if (!(await db.photo.findFirst({ where: { id: photoId, galleryId: g.id }, select: { id: true } }))) return fail("That photo isn't in this gallery anymore.", 404);
  const b = await readJson<{ hearted: boolean; comment: string }>(req);
  const data: { hearted?: boolean; comment?: string | null } = {};
  if (typeof b.hearted === "boolean") data.hearted = b.hearted;
  if (typeof b.comment === "string") {
    if (b.comment.length > 500) return fail("Comments can be up to 500 characters.");
    data.comment = b.comment.trim() || null;
  }
  const existing = sel.items.find((i) => i.photoId === photoId);
  if (data.hearted && !existing?.hearted && g.maxSelections && (await heartCount(sel.id)) >= g.maxSelections) {
    return fail(`You've already picked ${g.maxSelections} of ${g.maxSelections} photos — that's the limit for this gallery. Remove a heart from another photo to choose this one instead.`, 409);
  }
  const item = await db.selectionItem.upsert({
    where: { selectionId_photoId: { selectionId: sel.id, photoId } },
    update: data,
    create: { selectionId: sel.id, photoId, hearted: !!data.hearted, comment: data.comment ?? null },
  });
  return json({ photoId, hearted: item.hearted, comment: item.comment, count: await heartCount(sel.id) });
});
