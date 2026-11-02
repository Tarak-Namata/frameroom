import { db } from "@/lib/db";
import { fail, json, requireUser } from "@/lib/http";
import { safe } from "@/lib/errors";

export const POST = safe(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const s = await db.selection.findUnique({ where: { id } });
  if (!s) return fail("This selection doesn't exist anymore.", 404);
  await db.selection.update({ where: { id }, data: { status: "open" } });
  return json({ ok: true });
});
