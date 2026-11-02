"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";

export function GeneralForm({ appUrl, appUrlFromEnv }: { appUrl: string | null; appUrlFromEnv: string | null }) {
  const [url, setUrl] = useState(appUrl || "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { appUrl: url } });
      toast.success("Address saved. New share links will use it.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6" data-testid="general-settings-form">
      <div>
        <label className="label" htmlFor="app-url">Public address</label>
        {appUrlFromEnv ? (
          <>
            <input id="app-url" value={appUrlFromEnv} readOnly className="field bg-neutral-50 font-mono text-xs" data-testid="app-url-input" />
            <p className="mt-2 text-xs text-neutral-500">Set by your hosting provider (APP_URL). Share links always use this address.</p>
          </>
        ) : (
          <>
            <input id="app-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://gallery.yourstudio.com" className="field font-mono text-xs" data-testid="app-url-input" />
            <p className="mt-2 text-xs text-neutral-500">The web address clients use to open your galleries. We filled this in when you set up your studio; change it if you add your own domain.</p>
          </>
        )}
      </div>
      {!appUrlFromEnv && <button disabled={busy} className="btn-primary" data-testid="app-url-save-button">{busy ? "Saving…" : "Save address"}</button>}
    </form>
  );
}
