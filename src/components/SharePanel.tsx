"use client";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import type { GalleryDetail } from "./GalleryEditor";

export function SharePanel({ g, onChange }: { g: GalleryDetail; onChange: () => void }) {
  const [url, setUrl] = useState(g.shareUrl);
  const [copied, setCopied] = useState(false);
  const [protect, setProtect] = useState(g.hasPassword);
  const [password, setPassword] = useState("");
  useEffect(() => setUrl(g.shareUrl), [g.shareUrl]);
  useEffect(() => setProtect(g.hasPassword), [g.hasPassword]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return toast.error("Couldn't copy — select the link and copy it manually");
    }
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  }

  async function savePassword(value: string | null) {
    try {
      await api(`/api/admin/galleries/${g.id}`, { method: "PATCH", body: { password: value } });
      toast.success(value ? "Password set" : "Password removed");
      setPassword("");
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function toggle() {
    if (protect && g.hasPassword) savePassword(null);
    setProtect(!protect);
  }

  return (
    <section className="border border-neutral-200 bg-surface p-6" data-testid="share-panel">
      <p className="caption">Share</p>
      <h2 className="mt-2 font-serif text-2xl">Private link</h2>
      <div className="mt-5 flex">
        <input readOnly value={url} className="field truncate font-mono text-xs" data-testid="gallery-share-url" onFocus={(e) => e.target.select()} />
        <button onClick={copy} className="btn-primary px-4" aria-label="Copy link" data-testid="gallery-share-link-button">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="btn-ghost -ml-3 mt-2" data-testid="gallery-open-link">Open client view <ExternalLink className="h-3 w-3" /></a>
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <button onClick={toggle} className="flex w-full items-center justify-between text-left" role="switch" aria-checked={protect} data-testid="gallery-password-toggle">
          <span className="flex items-center gap-2 text-sm">{protect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} Password protection</span>
          <span className={`relative h-5 w-9 transition-colors ${protect ? "bg-[var(--studio-accent)]" : "bg-neutral-300"}`}>
            <span className={`absolute top-0.5 h-4 w-4 bg-surface transition-transform ${protect ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </span>
        </button>
        {protect && (
          <form className="mt-4 flex" onSubmit={(e) => { e.preventDefault(); savePassword(password); }}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required placeholder={g.hasPassword ? "Set a new password" : "Choose a password"} className="field" data-testid="share-password-input" />
            <button className="btn-secondary px-4" data-testid="share-password-save">Save</button>
          </form>
        )}
        <p className="mt-3 text-xs text-neutral-500" data-testid="share-password-status">{g.hasPassword ? "Clients need the password to view." : "Anyone with the link can view."}</p>
      </div>
    </section>
  );
}
