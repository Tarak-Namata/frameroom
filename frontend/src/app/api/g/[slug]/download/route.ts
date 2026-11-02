import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";
import { db } from "@/lib/db";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { storage, streamResponse } from "@/lib/storage";

function uniqueName(name: string, used: Set<string>) {
  const clean = name.replace(/[\\/:*?"<>|]/g, "_");
  const dot = clean.lastIndexOf(".");
  let n = clean;
  for (let i = 1; used.has(n); i++) n = dot > 0 ? `${clean.slice(0, dot)}-${i}${clean.slice(dot)}` : `${clean}-${i}`;
  used.add(n);
  return n;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGalleryBySlug(slug);
  if (!g || !(await canView(g))) return new Response("Not found", { status: 404 });
  const photos = await db.photo.findMany({ where: { galleryId: g.id }, orderBy: { createdAt: "asc" } });
  if (!photos.length) return new Response("Gallery is empty", { status: 404 });
  const out = new PassThrough();
  const zip = new ZipArchive({ store: true });
  zip.on("error", (e: Error) => out.destroy(e));
  zip.pipe(out);
  (async () => {
    const used = new Set<string>();
    for (const p of photos) {
      try {
        const entry = new Promise((r) => zip.once("entry", r));
        zip.append(await storage.get(p.originalKey), { name: uniqueName(p.filename, used) });
        await entry;
      } catch {}
    }
    await zip.finalize();
  })();
  const name = g.title.replace(/[^\w\- ]+/g, "").trim() || "gallery";
  return streamResponse(out, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${name}.zip"`,
    "Cache-Control": "no-store",
  });
}
