"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, testId }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; testId?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade sm:items-center" onMouseDown={onClose}>
      <div role="dialog" aria-label={title} data-testid={testId} className="w-full max-w-lg animate-zoomin border border-neutral-200 bg-surface p-6 sm:p-8" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <h2 className="font-serif text-3xl font-light tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2 -mt-1 px-2" aria-label="Close" data-testid="modal-close-button">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
