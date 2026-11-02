"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { ClientSelect } from "./ClientSelect";
import type { GalleryDetail } from "./GalleryEditor";

export function GalleryDetails({ g, onChange }: { g: GalleryDetail; onChange: () => void }) {
  const [title, setTitle] = useState(g.title);
  const [clientId, setClientId] = useState(g.clientId || "");
  const [max, setMax] = useState(g.maxSelections ? String(g.maxSelections) : "");
  useEffect(() => { setTitle(g.title); setClientId(g.clientId || ""); setMax(g.maxSelections ? String(g.maxSelections) : ""); }, [g.title, g.clientId, g.maxSelections]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/admin/galleries/${g.id}`, { method: "PATCH", body: { title, clientId, maxSelections: max.trim() || null } });
      toast.success("Gallery updated");
      onChange();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 border border-neutral-200 bg-surface p-6" data-testid="gallery-details-form">
      <p className="caption">Details</p>
      <div>
        <label className="label" htmlFor="gd-title">Title</label>
        <input id="gd-title" required value={title} onChange={(e) => setTitle(e.target.value)} className="field" data-testid="gallery-edit-title-input" />
      </div>
      <ClientSelect value={clientId} onChange={setClientId} />
      <div>
        <label className="label" htmlFor="gd-max">Max selections <span className="normal-case tracking-normal text-neutral-400">(optional)</span></label>
        <input id="gd-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))} placeholder="No limit" className="field" data-testid="gallery-max-selections-input" />
        <p className="mt-2 text-xs text-neutral-500">Leave empty and clients can heart as many favorites as they like. Set a number (e.g. 30 for an album) to cap their picks.</p>
      </div>
      <button className="btn-secondary w-full" data-testid="gallery-details-save">Save details</button>
    </form>
  );
}
