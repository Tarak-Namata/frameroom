"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "../Modal";

export function IdentifyModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (name: string, email: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(name, email);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Before you pick" testId="proof-identify-modal">
      <p className="-mt-2 mb-6 text-sm leading-relaxed text-neutral-600">Tell us who you are so your photographer knows whose favorites these are. No account needed — you'll only do this once.</p>
      <form onSubmit={submit} className="space-y-5">
        <div><label className="label" htmlFor="pi-name">Your name</label><input id="pi-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus autoComplete="name" className="field" data-testid="proof-name-input" /></div>
        <div><label className="label" htmlFor="pi-email">Your email</label><input id="pi-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" className="field" data-testid="proof-email-input" /></div>
        {error && <p className="text-sm text-red-800" data-testid="proof-identify-error">{error}</p>}
        <button disabled={busy} className="btn-primary w-full" data-testid="proof-identify-submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start choosing"}</button>
      </form>
    </Modal>
  );
}
