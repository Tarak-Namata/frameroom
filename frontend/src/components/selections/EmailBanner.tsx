"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, X } from "lucide-react";
import { api } from "@/lib/client-api";

// Shown only when SMTP isn't set up and the photographer hasn't dismissed it.
export function EmailBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    api("/api/admin/settings").then((s) => setShow(!s.email.configured && !s.email.bannerDismissed)).catch(() => {});
  }, []);

  async function dismiss() {
    setShow(false);
    await api("/api/admin/settings/email-banner", { method: "POST" }).catch(() => {});
  }

  if (!show) return null;
  return (
    <div className="flex animate-fade items-center gap-4 border border-neutral-200 bg-surface px-5 py-4" data-testid="email-banner">
      <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
      <p className="flex-1 text-sm text-neutral-700">
        Want an email when clients submit?{" "}
        <Link href="/admin/settings?tab=email" className="underline underline-offset-4 hover:text-neutral-950" data-testid="email-banner-link">Set up email in Settings.</Link>
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="p-1 text-neutral-400 transition-colors hover:text-neutral-900" data-testid="email-banner-dismiss"><X className="h-4 w-4" /></button>
    </div>
  );
}
