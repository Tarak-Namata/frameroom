"use client";
import { Heart } from "lucide-react";

export function HeartButton({ on, onClick, className = "", testId = "photo-heart-button" }: { on: boolean; onClick: () => void; className?: string; testId?: string }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-pressed={on} aria-label={on ? "Remove from selections" : "Add to selections"} data-testid={testId}
      className={`flex h-11 w-11 items-center justify-center transition-transform duration-150 active:scale-90 ${className}`}>
      <Heart className={`h-5 w-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors ${on ? "fill-[var(--studio-accent)] text-[var(--studio-accent)]" : "fill-black/10 text-white"}`} strokeWidth={1.75} />
    </button>
  );
}
