"use client";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

export function AccountStep({ setupCode, onDone }: { setupCode: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/setup", { method: "POST", body: { ...Object.fromEntries(new FormData(e.currentTarget)), setupCode } });
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="setup-form">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" required className="field" placeholder="Ada Lens" data-testid="setup-name-input" /></div>
        <div><label className="label" htmlFor="studioName">Studio name</label><input id="studioName" name="studioName" className="field" placeholder="Lens & Light" data-testid="setup-studio-input" /></div>
      </div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" className="field" data-testid="setup-email-input" /></div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" data-testid="setup-password-input" />
        <p className="mt-2 text-xs text-neutral-500">At least 8 characters. You'll use this email and password to sign in.</p>
      </div>
      {error && <p className="border-l-2 border-red-800 pl-3 text-sm text-red-800" data-testid="auth-error">{error}</p>}
      <button disabled={busy} className="btn-primary w-full" data-testid="setup-submit-button">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create my studio <ArrowRight className="h-4 w-4" /></>}</button>
    </form>
  );
}
