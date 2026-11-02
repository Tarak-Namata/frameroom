"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";

export function ClientSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { api("/api/admin/clients").then(setClients); }, []);
  return (
    <div>
      <label className="label" htmlFor="g-client">Client</label>
      <select id="g-client" value={value} onChange={(e) => onChange(e.target.value)} className="field appearance-none" data-testid="gallery-client-select">
        <option value="">— No client —</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}
