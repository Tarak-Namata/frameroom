"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { LogoField } from "../LogoField";
import { AccentPicker } from "../AccentPicker";

export function BrandingForm({ initial }: { initial: { studioName: string; accentColor: string; hasLogo: boolean } }) {
  const router = useRouter();
  const [studioName, setName] = useState(initial.studioName);
  const [accent, setAccent] = useState(initial.accentColor);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { studioName, accentColor: accent } });
      toast.success("Branding saved");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-12" data-testid="settings-form">
      <LogoField initialHasLogo={initial.hasLogo} />
      <div>
        <label className="label" htmlFor="studioName">Studio name</label>
        <input id="studioName" value={studioName} onChange={(e) => setName(e.target.value)} required className="field max-w-md" data-testid="studio-name-input" />
      </div>
      <div>
        <span className="label">Accent color</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>
      <button disabled={busy} className="btn-primary" data-testid="save-settings-button">{busy ? "Saving…" : "Save branding"}</button>
    </form>
  );
}
