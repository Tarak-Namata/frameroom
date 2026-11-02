"use client";
import { useState } from "react";
import { CheckCircle2, Heart, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Proofing } from "@/lib/use-proofing";
import { Modal } from "../Modal";

export function ProofBar({ p, onlyFavs, setOnlyFavs }: { p: Proofing; onlyFavs: boolean; setOnlyFavs: (v: boolean) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const atLimit = !!p.max && p.count >= p.max;
  const label = p.max ? `${p.count} of ${p.max} selected` : `${p.count} selected`;

  async function submit() {
    setBusy(true);
    try {
      toast.success(await p.submit(), { duration: 6000 });
      setConfirm(false);
    } catch (e) {
      toast.error((e as Error).message, { duration: 6000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg" data-testid="proof-bar">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-12 lg:px-20">
          <button onClick={() => setOnlyFavs(!onlyFavs)} aria-pressed={onlyFavs} data-testid="proof-filter-toggle"
            className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${onlyFavs ? "border-neutral-900 bg-neutral-900 text-neutral-50" : "border-neutral-300 text-neutral-700 hover:border-neutral-900"}`}>
            <Heart className={`h-3.5 w-3.5 ${onlyFavs ? "fill-current" : ""}`} /> <span className="whitespace-nowrap" data-testid="proof-counter">{label}</span>
          </button>
          {atLimit && !p.locked && <span className="hidden text-xs text-neutral-500 sm:inline" data-testid="proof-limit-note">You've reached the limit</span>}
          <div className="ml-auto">
            {p.locked ? (
              <span className="flex items-center gap-2 text-xs text-neutral-700" data-testid="proof-submitted"><CheckCircle2 className="h-4 w-4 text-green-700" /> Submitted</span>
            ) : (
              <button onClick={() => (p.needIdentity(() => setConfirm(true)) ? null : setConfirm(true))} disabled={p.state.me !== null && p.count === 0} className="btn-primary px-4 py-2.5" data-testid="proof-submit-button">
                <Send className="h-3.5 w-3.5" /> Submit<span className="hidden sm:inline">&nbsp;selections</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit your selections?" testId="proof-submit-modal">
        <p className="text-sm leading-relaxed text-neutral-600">You've chosen <strong>{label.replace(" selected", "")}</strong> photo{p.count === 1 ? "" : "s"}. Once you submit, your list is locked and sent to your photographer. They can reopen it if you need changes.</p>
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={() => setConfirm(false)} className="btn-secondary">Keep choosing</button>
          <button onClick={submit} disabled={busy} className="btn-primary" data-testid="proof-submit-confirm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}</button>
        </div>
      </Modal>
    </>
  );
}
