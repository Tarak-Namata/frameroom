"use client";
import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { api, formatDate } from "@/lib/client-api";
import type { PublicSettings } from "./SettingsTabs";
import { StatusBadge } from "./StatusBadge";

export function EmailForm({ initial }: { initial: PublicSettings["email"] }) {
  const [cfg, setCfg] = useState(initial);
  const [form, setForm] = useState({ host: initial.host || "", port: String(initial.port || 587), secure: initial.secure, user: initial.user || "", password: "", from: initial.from || "" });
  const [busy, setBusy] = useState<"" | "save" | "test" | "remove">("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function run(kind: typeof busy, fn: () => Promise<void>) {
    setBusy(kind);
    try { await fn(); } catch (e) { toast.error((e as Error).message, { duration: 8000 }); } finally { setBusy(""); }
  }
  const save = (e: React.FormEvent) => { e.preventDefault(); run("save", async () => { setCfg(await api("/api/admin/settings/email", { method: "PUT", body: form })); setForm({ ...form, password: "" }); toast.success("Email settings saved. Send a test email to check them."); }); };
  const test = () => run("test", async () => { toast.success((await api("/api/admin/settings/email/test", { method: "POST" })).message); setCfg({ ...cfg, lastError: null }); });
  const remove = () => run("remove", async () => {
    await api("/api/admin/settings/email", { method: "DELETE" });
    setCfg({ ...cfg, configured: false, hasPassword: false });
    setForm({ host: "", port: "587", secure: false, user: "", password: "", from: "" });
    toast.success("Email disconnected");
  });

  return (
    <form onSubmit={save} className="space-y-6" data-testid="email-settings-form">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-lg text-sm leading-relaxed text-neutral-600"><Mail className="mr-2 inline h-4 w-4" />Optional. Connect your email account and Frameroom will email you when clients submit their selections. You can skip this — everything else works without it.</p>
        <StatusBadge on={cfg.configured && !cfg.lastError} label={cfg.configured && cfg.lastError ? "Saved — not working" : undefined} testId="email-status" />
      </div>
      {cfg.lastError && (
        <div className="border-l-2 border-red-800 bg-red-50/60 px-4 py-3 text-sm text-red-900" data-testid="email-last-error">
          <p className="font-medium">Last email didn't go out{cfg.lastErrorAt ? ` (${formatDate(cfg.lastErrorAt)})` : ""}</p>
          <p className="mt-1">{cfg.lastError}</p>
          <p className="mt-1 text-red-900/70">Don't worry — the client's selections were saved and are waiting in Frameroom.</p>
        </div>
      )}
      {!cfg.configured && (
        <p className="border-l-2 border-neutral-300 pl-3 text-sm text-neutral-600" data-testid="email-off-note">
          Email notifications are off. You'll still see new selections on your dashboard — set up email below if you'd also like an email when clients submit.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
        <div><label className="label" htmlFor="smtp-host">Email server (SMTP)</label><input id="smtp-host" value={form.host} onChange={set("host")} placeholder="smtp.gmail.com" required className="field" data-testid="smtp-host-input" /></div>
        <div><label className="label" htmlFor="smtp-port">Port</label><input id="smtp-port" value={form.port} onChange={set("port")} inputMode="numeric" className="field" data-testid="smtp-port-input" /></div>
      </div>
      <label className="flex items-center gap-3 text-sm text-neutral-700"><input type="checkbox" checked={form.secure} onChange={set("secure")} className="h-4 w-4 accent-neutral-900" data-testid="smtp-secure-checkbox" /> Secure connection (SSL) — usually on for port 465, off for 587</label>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="smtp-user">Username</label><input id="smtp-user" value={form.user} onChange={set("user")} autoComplete="off" placeholder="you@studio.com" className="field" data-testid="smtp-user-input" /></div>
        <div><label className="label" htmlFor="smtp-pass">Password</label><input id="smtp-pass" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" placeholder={cfg.hasPassword ? "Saved — leave blank to keep" : "App password"} className="field" data-testid="smtp-password-input" /></div>
      </div>
      <div><label className="label" htmlFor="smtp-from">From address</label><input id="smtp-from" value={form.from} onChange={set("from")} placeholder="Lens & Light <hello@yourstudio.com>" required className="field" data-testid="smtp-from-input" /></div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button disabled={!!busy} className="btn-primary" data-testid="smtp-save-button">{busy === "save" ? "Saving…" : "Save"}</button>
        {cfg.configured && <button type="button" onClick={test} disabled={!!busy} className="btn-secondary" data-testid="smtp-test-button"><Send className="h-3.5 w-3.5" /> {busy === "test" ? "Sending…" : "Send test email"}</button>}
        {cfg.configured && <button type="button" onClick={remove} disabled={!!busy} className="btn-ghost text-red-800 hover:bg-red-50" data-testid="smtp-remove-button">Disconnect</button>}
      </div>
    </form>
  );
}
