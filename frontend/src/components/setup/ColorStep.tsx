"use client";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { AccentPicker } from "../AccentPicker";

export function ColorStep({ initialAccent, onDone }: { initialAccent: string; onDone: () => void }) {
  const [accent, setAccent] = useState(initialAccent);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { accentColor: accent } });
      toast.success("Your studio is ready");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="setup-color-step">
      <AccentPicker value={accent} onChange={setAccent} />
      <button onClick={save} disabled={busy} className="btn-primary w-full" data-testid="setup-finish-button">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish setup <Check className="h-4 w-4" /></>}
      </button>
    </div>
  );
}
