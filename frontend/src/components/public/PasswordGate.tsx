"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { api } from "@/lib/client-api";
import { StudioMark, type Brand } from "./StudioMark";

export function PasswordGate({ slug, title, brand }: { slug: string; title: string; brand: Brand }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/g/${slug}/unlock`, { method: "POST", body: { password } });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-10 sm:px-14">
      <StudioMark brand={brand} className="self-start" />
      <div className="mx-auto my-auto w-full max-w-md animate-rise py-16" data-testid="client-gallery-password-gate">
        <Lock className="h-5 w-5 text-neutral-500" strokeWidth={1.25} />
        <p className="caption mt-6">Private gallery</p>
        <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-neutral-600">Enter the password your photographer shared with you.</p>
        <form onSubmit={unlock} className="mt-8 flex">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus placeholder="Password" className="field" data-testid="client-gallery-password-input" />
          <button disabled={busy} className="btn-primary px-5" aria-label="Unlock gallery" data-testid="client-gallery-unlock-button"><ArrowRight className="h-4 w-4" /></button>
        </form>
        {error && <p className="mt-3 text-sm text-red-800" data-testid="client-gallery-password-error">{error}</p>}
      </div>
    </main>
  );
}
