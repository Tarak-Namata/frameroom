import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { storage, streamResponse } from "@/lib/storage";

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug, id } = await params;
  const g = await getGalleryBySlug(slug);
  if (!g || !(await canView(g))) return new Response("Not found", { status: 404 });
  const p = await db.photo.findFirst({ where: { id, galleryId: g.id } });
  if (!p) return new Response("Not found", { status: 404 });
  const v = req.nextUrl.searchParams.get("v");
  const original = v === "original";
  const key = original ? p.originalKey : v === "large" ? p.largeKey : p.thumbKey;
  const headers: Record<string, string> = {
    "Content-Type": original ? p.mime : "image/webp",
    "Cache-Control": "private, max-age=86400",
  };
  if (original) headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(p.filename)}"`;
  try {
    return streamResponse(await storage.get(key), headers);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
