"use client";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";

export function CodeStep({ onDone }: { onDone: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/setup", { method: "POST", body: { setupCode: code, checkOnly: true } });
      onDone(code);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="setup-code-form">
      <div>
        <label className="label" htmlFor="setup-code">Setup code</label>
        <input id="setup-code" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus autoComplete="off" className="field font-mono tracking-widest" data-testid="setup-code-input" />
      </div>
      {error && <p className="border-l-2 border-red-800 pl-3 text-sm text-red-800" data-testid="setup-code-error">{error}</p>}
      <button disabled={busy} className="btn-primary w-full" data-testid="setup-code-submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}</button>
    </form>
  );
}
