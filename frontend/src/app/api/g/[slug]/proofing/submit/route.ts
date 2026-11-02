import { after } from "next/server";
import { db } from "@/lib/db";
import { fail, json } from "@/lib/http";
import { safe } from "@/lib/errors";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { getMySelection, heartCount, notifyOwner } from "@/lib/proofing";

export const POST = safe(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const g = await getGalleryBySlug((await params).slug);
  if (!g || !(await canView(g))) return fail("This gallery isn't available.", 404);
  const sel = await getMySelection(g.id);
  if (!sel) return fail("Please tell us your name and email first.", 401);
  if (sel.status === "submitted") return json({ ok: true, message: "Selections submitted. Your photographer has been notified." });
  const count = await heartCount(sel.id);
  if (!count) return fail("Tap the heart on at least one photo before submitting.");
  if (g.maxSelections && count > g.maxSelections) {
    return fail(`This gallery allows ${g.maxSelections} selections and you have ${count}. Please remove ${count - g.maxSelections} before submitting.`);
  }
  await db.selection.update({ where: { id: sel.id }, data: { status: "submitted", submittedAt: new Date(), seenAt: null } });
  after(() => notifyOwner(sel.id, req));
  return json({ ok: true, message: "Selections submitted. Your photographer has been notified." });
});
