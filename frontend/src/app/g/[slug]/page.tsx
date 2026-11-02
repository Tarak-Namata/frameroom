import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, getSettings } from "@/lib/db";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { PasswordGate } from "@/components/public/PasswordGate";
import { ClientGallery } from "@/components/public/ClientGallery";
import { getMySelection, toState } from "@/lib/proofing";
import { accentVars } from "@/lib/accent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PublicGallery({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getGalleryBySlug(slug);
  if (!g) notFound();
  const s = await getSettings();
  const brand = { studioName: s.studioName, hasLogo: !!s.logoKey, accent: s.accentColor };
  const style = accentVars(s.accentColor);
  if (!(await canView(g))) {
    return <div className="accent-scope" style={style}><PasswordGate slug={slug} title={g.title} brand={brand} /></div>;
  }
  const photos = await db.photo.findMany({ where: { galleryId: g.id }, orderBy: { createdAt: "asc" }, select: { id: true, filename: true, width: true, height: true } });
  const proofing = toState(g.maxSelections, await getMySelection(g.id));
  return (
    <div className="accent-scope" style={style}>
      <ClientGallery slug={slug} title={g.title} clientName={g.client?.name ?? null} date={g.createdAt.toISOString()} photos={photos} brand={brand} proofing={proofing} />
    </div>
  );
}
