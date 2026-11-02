"use client";
import { useState } from "react";
import { Copy, Download, Heart, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, formatDate } from "@/lib/client-api";

export type AdminSelection = {
  id: string; clientName: string; clientEmail: string; status: string; submittedAt: string | null; unread: boolean; updatedAt: string;
  items: { photoId: string; filename: string; hearted: boolean; comment: string | null }[];
};

export function SelectionCard({ s, slug, max, onChange }: { s: AdminSelection; slug: string; max: number | null; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const picks = s.items.filter((i) => i.hearted);
  const commentsOnly = s.items.filter((i) => !i.hearted && i.comment);
  const submitted = s.status === "submitted";

  async function reopen() {
    if (!confirm(`Reopen ${s.clientName}'s selection so they can make changes?`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/selections/${s.id}/reopen`, { method: "POST" });
      toast.success(`Reopened — ${s.clientName} can edit their picks again`);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyNames() {
    try {
      await navigator.clipboard.writeText(picks.map((p) => p.filename.replace(/\.[^.]+$/, "")).join(", "));
      toast.success("Filenames copied — paste them into Lightroom's Library filter");
    } catch {
      toast.error("Couldn't copy. Use Export CSV instead.");
    }
  }

  return (
    <section className="border border-neutral-200 bg-surface" data-testid="selection-card">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-2xl" data-testid="selection-client-name">{s.clientName}</h3>
            <span className={`px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${submitted ? "bg-neutral-900 text-neutral-50" : "border border-neutral-300 text-neutral-500"}`} data-testid="selection-status">{submitted ? "Submitted" : "In progress"}</span>
            {s.unread && <span className="bg-[var(--studio-accent)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--studio-accent-fg)]" data-testid="selection-unread">New</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{s.clientEmail}</p>
          <p className="caption mt-2" data-testid="selection-count">{picks.length}{max ? ` of ${max}` : ""} selected · {submitted && s.submittedAt ? `submitted ${formatDate(s.submittedAt)}` : `last active ${formatDate(s.updatedAt)}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.items.length > 0 && <a href={`/api/admin/selections/${s.id}/csv`} className="btn-secondary px-4 py-2" title="Selected and commented photos, with comments and client details" data-testid="selection-csv-button"><Download className="h-3.5 w-3.5" /> Export CSV</a>}
          {picks.length > 0 && <a href={`/api/admin/selections/${s.id}/csv?only=selected`} className="btn-ghost" title="Just the filenames of selected photos, for Lightroom" data-testid="selection-csv-selected-button"><Download className="h-3.5 w-3.5" /> Selected only</a>}
          {picks.length > 0 && <button onClick={copyNames} className="btn-ghost" data-testid="selection-copy-button"><Copy className="h-3.5 w-3.5" /> Copy filenames</button>}
          {submitted && <button onClick={reopen} disabled={busy} className="btn-ghost" data-testid="selection-reopen-button"><RotateCcw className="h-3.5 w-3.5" /> Reopen</button>}
        </div>
      </header>
      {s.items.length === 0 && <p className="p-6 text-sm text-neutral-500">{s.clientName} hasn't picked any photos yet.</p>}
      {picks.length > 0 && <PhotoList items={picks} slug={slug} testId="selection-items" />}
      {commentsOnly.length > 0 && (
        <div className="border-t border-neutral-200" data-testid="selection-notes-section">
          <div className="px-6 pt-6">
            <h4 className="font-serif text-xl">Notes on other photos</h4>
            <p className="mt-1 text-xs text-neutral-500">{s.clientName} commented on {commentsOnly.length === 1 ? "this photo" : `these ${commentsOnly.length} photos`} without selecting {commentsOnly.length === 1 ? "it" : "them"}.</p>
          </div>
          <PhotoList items={commentsOnly} slug={slug} testId="selection-notes-items" />
        </div>
      )}
    </section>
  );
}

function PhotoList({ items, slug, testId }: { items: AdminSelection["items"]; slug: string; testId: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-5" data-testid={testId}>
      {items.map((i) => (
        <figure key={i.photoId} data-testid="selection-item">
          <div className="relative aspect-square overflow-hidden bg-neutral-100">
            <img src={`/api/g/${slug}/photos/${i.photoId}?v=thumb`} alt={i.filename} loading="lazy" className="h-full w-full object-cover" />
            {i.hearted && <Heart className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow" />}
          </div>
          <figcaption className="mt-2 truncate text-xs text-neutral-700">{i.filename}</figcaption>
          {i.comment && <p className="mt-1 flex gap-1.5 text-xs leading-snug text-neutral-600" data-testid="selection-item-comment"><MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />{i.comment}</p>}
        </figure>
      ))}
    </div>
  );
}
