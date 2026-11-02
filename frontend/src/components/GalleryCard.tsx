import Link from "next/link";
import { Heart, ImageIcon, Lock } from "lucide-react";
import { formatDate } from "@/lib/client-api";

export type GalleryCardData = { id: string; slug: string; title: string; createdAt: string; clientName?: string | null; count: number; coverId?: string | null; hasPassword: boolean; unread?: number };

export function GalleryCard({ g }: { g: GalleryCardData }) {
  return (
    <Link href={`/admin/galleries/${g.id}`} className="group block animate-rise" data-testid="gallery-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {g.coverId ? (
          <img src={`/api/g/${g.slug}/photos/${g.coverId}?v=thumb`} alt={g.title} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400"><ImageIcon className="h-6 w-6" strokeWidth={1} /></div>
        )}
        {g.hasPassword && <span className="absolute right-3 top-3 flex items-center gap-1 bg-surface/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur"><Lock className="h-3 w-3" /> Protected</span>}
        {!!g.unread && <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-[var(--studio-accent)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--studio-accent-fg)]" data-testid="gallery-unread-badge"><Heart className="h-3 w-3 fill-current" /> {g.unread} new</span>}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-2xl font-medium tracking-tight" data-testid="gallery-title">{g.title}</h3>
          <p className="mt-1 truncate text-sm text-neutral-600">{g.clientName || "No client"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="caption">{g.count} photos</p>
          <p className="caption mt-1">{formatDate(g.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}
