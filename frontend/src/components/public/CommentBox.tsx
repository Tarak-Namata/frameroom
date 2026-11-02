"use client";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { Proofing } from "@/lib/use-proofing";

export function CommentBox({ p, photoId }: { p: Proofing; photoId: string }) {
  const saved = p.items.get(photoId)?.comment || "";
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(saved);
  useEffect(() => { setText(saved); setOpen(false); }, [photoId, saved]);

  function start() {
    if (p.needIdentity(() => setOpen(true))) return;
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (await p.saveComment(photoId, text)) setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={start} disabled={p.locked && !saved} className="flex max-w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/80 transition-colors hover:text-white disabled:opacity-40" data-testid="lightbox-comment-button">
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="truncate" data-testid="lightbox-comment-text">{saved || "Add a comment"}</span>
      </button>
    );
  }
  return (
    <form onSubmit={save} className="flex w-full max-w-xl gap-2 px-3" data-testid="lightbox-comment-form">
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} autoFocus disabled={p.locked} placeholder="e.g. Can this be black & white?"
        onKeyDown={(e) => e.stopPropagation()} className="min-w-0 flex-1 border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none" data-testid="lightbox-comment-input" />
      <button disabled={p.locked} className="bg-white px-4 text-xs font-semibold uppercase tracking-widest text-neutral-900" data-testid="lightbox-comment-save">Save</button>
    </form>
  );
}
