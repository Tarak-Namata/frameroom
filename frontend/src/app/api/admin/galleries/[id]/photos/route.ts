import { db } from "@/lib/db";
import { fail, json, requireUser } from "@/lib/http";
import { processPhoto, validateFile } from "@/lib/images";
import { friendlyMessage } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  if (!(await db.gallery.findUnique({ where: { id } }))) return fail("Gallery not found", 404);
  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("files") ?? []).filter((f): f is File => f instanceof File);
  if (!files.length) return fail("No files uploaded");
  const created = [];
  const errors: string[] = [];
  for (const file of files) {
    const err = validateFile(file);
    if (err) {
      errors.push(err);
      continue;
    }
    try {
      const data = await processPhoto(id, file);
      const p = await db.photo.create({ data: { ...data, galleryId: id, filename: file.name.slice(0, 200) } });
      created.push({ id: p.id, filename: p.filename, width: p.width, height: p.height, size: p.size });
    } catch (e) {
      console.error("[frameroom] upload failed:", e);
      errors.push(`${file.name}: ${e instanceof Error && e.message.startsWith(file.name) ? e.message.slice(file.name.length + 2) : friendlyMessage(e, "couldn't be saved. Please try again.")}`);
    }
  }
  if (!created.length) return fail(errors.join("; ") || "Upload failed", 400);
  return json({ photos: created, errors }, 201);
}
