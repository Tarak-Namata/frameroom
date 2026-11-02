"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatDate } from "@/lib/client-api";
import { Uploader } from "./Uploader";
import { PhotoManager, type AdminPhoto } from "./PhotoManager";
import { SharePanel } from "./SharePanel";
import { GalleryDetails } from "./GalleryDetails";
import { SelectionsPanel } from "./selections/SelectionsPanel";

export type GalleryDetail = { id: string; slug: string; shareUrl: string; title: string; clientId: string | null; client: { name: string } | null; hasPassword: boolean; maxSelections: number | null; unread: number; createdAt: string; photos: AdminPhoto[] };

export function GalleryEditor({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [g, setG] = useState<GalleryDetail | null>(null);
  const [tab, setTab] = useState(params.get("tab") === "selections" ? "selections" : "photos");
  const load = useCallback(() => api<GalleryDetail>(`/api/admin/galleries/${id}`).then(setG).catch((e) => toast.error(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!confirm("Delete this gallery and all its photos? This cannot be undone.")) return;
    await api(`/api/admin/galleries/${id}`, { method: "DELETE" });
    toast.success("Gallery deleted");
    router.push("/admin/galleries");
  }

  function openTab(t: string) {
    setTab(t);
    router.replace(`/admin/galleries/${id}${t === "selections" ? "?tab=selections" : ""}`, { scroll: false });
  }

  if (!g) return <p className="caption" data-testid="gallery-loading">Loading…</p>;
  const tabs = [{ id: "photos", label: `Photos · ${g.photos.length}` }, { id: "selections", label: "Selections" }];
  return (
    <div className="max-w-6xl">
      <Link href="/admin/galleries" className="btn-ghost -ml-3 mb-6"><ArrowLeft className="h-3.5 w-3.5" /> Galleries</Link>
      <header className="mb-8 flex animate-rise flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="caption">{g.client?.name || "No client"} · {formatDate(g.createdAt)} · <span data-testid="gallery-photo-count">{g.photos.length}</span> photos</p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl" data-testid="gallery-title">{g.title}</h1>
        </div>
        <button onClick={remove} className="btn-ghost text-red-800 hover:bg-red-50 hover:text-red-900" data-testid="gallery-delete-button"><Trash2 className="h-3.5 w-3.5" /> Delete gallery</button>
      </header>
      <div className="mb-10 flex gap-1 border-b border-neutral-200" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => openTab(t.id)} data-testid={`gallery-tab-${t.id}`}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${tab === t.id ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
            {t.label}
            {t.id === "selections" && g.unread > 0 && <span className="bg-[var(--studio-accent)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--studio-accent-fg)]" data-testid="selections-tab-unread">{g.unread} new</span>}
          </button>
        ))}
      </div>
      {tab === "photos" ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10">
            <Uploader galleryId={g.id} onUploaded={load} />
            <PhotoManager slug={g.slug} photos={g.photos} onChange={load} />
          </div>
          <aside className="space-y-8">
            <SharePanel g={g} onChange={load} />
            <GalleryDetails g={g} onChange={load} />
          </aside>
        </div>
      ) : (
        <SelectionsPanel galleryId={g.id} onSeen={() => setG({ ...g, unread: 0 })} />
      )}
    </div>
  );
}
