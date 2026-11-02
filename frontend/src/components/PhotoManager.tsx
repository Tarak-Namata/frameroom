"use client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatBytes } from "@/lib/client-api";

export type AdminPhoto = { id: string; filename: string; width: number; height: number; size: number };

export function PhotoManager({ slug, photos, onChange }: { slug: string; photos: AdminPhoto[]; onChange: () => void }) {
  async function remove(p: AdminPhoto) {
    if (!confirm(`Delete ${p.filename}?`)) return;
    await api(`/api/admin/photos/${p.id}`, { method: "DELETE" });
    toast.success("Photo deleted");
    onChange();
  }
  if (!photos.length) return <p className="text-sm text-neutral-500" data-testid="upload-photo-grid-empty">No photos yet. Uploaded photos appear here with thumbnails.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-testid="upload-photo-grid">
      {photos.map((p) => (
        <figure key={p.id} className="group relative animate-fade" data-testid="admin-photo-item">
          <div className="aspect-square overflow-hidden bg-neutral-100">
            <img src={`/api/g/${slug}/photos/${p.id}?v=thumb`} alt={p.filename} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <figcaption className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-neutral-600">{p.filename}</span>
            <span className="caption shrink-0 text-[10px]">{formatBytes(p.size)}</span>
          </figcaption>
          <button onClick={() => remove(p)} aria-label={`Delete ${p.filename}`} data-testid="admin-photo-delete-button"
            className="absolute right-2 top-2 bg-surface/90 p-2 opacity-0 backdrop-blur transition-opacity hover:text-red-800 focus:opacity-100 group-hover:opacity-100">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </figure>
      ))}
    </div>
  );
}
