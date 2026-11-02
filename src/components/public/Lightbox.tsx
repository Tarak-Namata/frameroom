"use client";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import type { Proofing } from "@/lib/use-proofing";
import { HeartButton } from "./HeartButton";
import { CommentBox } from "./CommentBox";

export type PublicPhoto = { id: string; filename: string; width: number; height: number };
type Props = { photos: PublicPhoto[]; index: number; setIndex: (i: number | null) => void; src: (id: string, v: string) => string; p: Proofing };

export function Lightbox({ photos, index, setIndex, src, p }: Props) {
  const touch = useRef<number | null>(null);
  const photo = photos[index];
  const go = (d: number) => setIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (p.askIdentity) return;
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  });

  if (!photo) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="fixed inset-0 z-40 flex animate-fade flex-col bg-[#0a0a0b]/95 text-white backdrop-blur-md" data-testid="lightbox-modal"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div className="flex items-center justify-between px-2 py-2 sm:px-8 sm:py-3">
        <span className="px-2 font-mono text-xs tracking-[0.2em]" data-testid="lightbox-counter">{pad(index + 1)} / {pad(photos.length)}</span>
        <div className="flex items-center gap-1">
          <HeartButton on={!!p.items.get(photo.id)?.hearted} onClick={() => p.toggleHeart(photo.id)} testId="lightbox-heart-button" />
          <a href={src(photo.id, "original")} className="flex h-11 items-center gap-2 px-3 text-xs uppercase tracking-widest text-white/80 transition-colors hover:text-white" data-testid="lightbox-download-button"><Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span></a>
          <button onClick={() => setIndex(null)} className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:text-white" aria-label="Close" data-testid="lightbox-close-button"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
        <img key={photo.id} src={src(photo.id, "large")} alt={photo.filename} onDoubleClick={() => p.toggleHeart(photo.id)} className="max-h-full max-w-full animate-zoomin object-contain" data-testid="lightbox-image" />
        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-0 top-1/2 hidden -translate-y-1/2 p-3 text-white/70 transition-colors hover:text-white sm:left-6 sm:block" aria-label="Previous" data-testid="lightbox-prev-button"><ChevronLeft className="h-7 w-7" strokeWidth={1.25} /></button>
            <button onClick={() => go(1)} className="absolute right-0 top-1/2 hidden -translate-y-1/2 p-3 text-white/70 transition-colors hover:text-white sm:right-6 sm:block" aria-label="Next" data-testid="lightbox-next-button"><ChevronRight className="h-7 w-7" strokeWidth={1.25} /></button>
          </>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <CommentBox p={p} photoId={photo.id} />
        <p className="max-w-full truncate px-4 font-mono text-[11px] text-white/40">{photo.filename}</p>
      </div>
    </div>
  );
}
