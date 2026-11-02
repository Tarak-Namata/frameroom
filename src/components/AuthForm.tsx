"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

export function AuthForm({ mode }: { mode: "setup" | "login" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setup = mode === "setup";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: Object.fromEntries(new FormData(e.currentTarget)) });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid={setup ? "setup-form" : "login-form"}>
      {setup && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" name="name" required className="field" placeholder="Ada Lens" data-testid="setup-name-input" />
          </div>
          <div>
            <label className="label" htmlFor="studioName">Studio name</label>
            <input id="studioName" name="studioName" className="field" placeholder="Lens & Light" data-testid="setup-studio-input" />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" data-testid={setup ? "setup-email-input" : "login-email-input"} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={setup ? 8 : 1} autoComplete={setup ? "new-password" : "current-password"} className="field" data-testid={setup ? "setup-password-input" : "login-password-input"} />
        {setup && <p className="mt-2 text-xs text-neutral-500">At least 8 characters.</p>}
      </div>
      {error && <p className="border-l-2 border-red-800 pl-3 text-sm text-red-800" data-testid="auth-error">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full" data-testid={setup ? "setup-submit-button" : "login-submit-button"}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{setup ? "Create studio" : "Sign in"} <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
