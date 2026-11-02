"use client";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";

export function LogoField({ initialHasLogo }: { initialHasLogo: boolean }) {
  const [version, setVersion] = useState(initialHasLogo ? 1 : 0);
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Logo must be JPEG, PNG or WebP");
    if (file.size > 5 * 1024 * 1024) return toast.error("Logo must be under 5 MB");
    setBusy(true);
    const form = new FormData();
    form.append("logo", file);
    try {
      await api("/api/admin/settings/logo", { method: "POST", form });
      setVersion(Date.now());
      toast.success("Logo updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    await api("/api/admin/settings", { method: "PATCH", body: { removeLogo: true } });
    setVersion(0);
    toast.success("Logo removed");
  }

  return (
    <div>
      <span className="label">Logo</span>
      <div className="flex items-center gap-6">
        <div className="flex h-24 w-48 items-center justify-center border border-neutral-200 bg-surface p-3" data-testid="logo-preview">
          {version ? <img src={`/api/logo?v=${version}`} alt="Studio logo" className="max-h-full max-w-full object-contain dark:bg-white/90 dark:p-1" /> : <span className="caption">No logo</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label className={`btn-secondary cursor-pointer px-4 py-2 ${busy ? "opacity-50" : ""}`}>
            <ImagePlus className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload logo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} data-testid="logo-upload-input" />
          </label>
          {!!version && <button type="button" onClick={removeLogo} className="btn-ghost" data-testid="logo-remove-button"><X className="h-3.5 w-3.5" /> Remove</button>}
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">PNG with transparent background works best. Max 5 MB.</p>
    </div>
  );
}
