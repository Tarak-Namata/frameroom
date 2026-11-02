import { db } from "@/lib/db";
import { requireUser } from "@/lib/http";

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCsv = (rows: string[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

// Full export: every photo that is selected OR commented (selected first).
// ?only=selected: a plain filename list of the picks, for Lightroom.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const s = await db.selection.findUnique({
    where: { id },
    include: {
      gallery: { select: { title: true } },
      items: { where: { OR: [{ hearted: true }, { comment: { not: null } }] }, include: { photo: { select: { filename: true, createdAt: true } } } },
    },
  });
  if (!s) return new Response("This selection doesn't exist anymore.", { status: 404 });
  const items = s.items.sort((a, b) => Number(b.hearted) - Number(a.hearted) || a.photo.createdAt.getTime() - b.photo.createdAt.getTime());
  const selectedOnly = new URL(req.url).searchParams.get("only") === "selected";
  const submitted = s.submittedAt ? s.submittedAt.toISOString() : "";
  const csv = selectedOnly
    ? toCsv([["filename"], ...items.filter((i) => i.hearted).map((i) => [i.photo.filename])])
    : toCsv([
        ["filename", "selected", "comment", "client_name", "client_email", "submitted_at"],
        ...items.map((i) => [i.photo.filename, i.hearted ? "yes" : "no", i.comment || "", s.clientName, s.clientEmail, submitted]),
      ]);
  const base = `${s.gallery.title}-${s.clientName}-${selectedOnly ? "selected" : "selections"}`.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "selections";
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"`, "Cache-Control": "no-store" },
  });
}
