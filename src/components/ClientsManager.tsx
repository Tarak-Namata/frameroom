"use client";
import { useCallback, useEffect, useState } from "react";
import { Mail, Pencil, Plus, Search } from "lucide-react";
import { api, formatDate } from "@/lib/client-api";
import { PageHeader, Empty } from "./PageHeader";
import { ClientDialog, type Client } from "./ClientDialog";

type Row = Client & { createdAt: string; _count: { galleries: number } };

export function ClientsManager() {
  const [clients, setClients] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Client | null | undefined>(undefined);
  const [q, setQ] = useState("");
  const load = useCallback(() => api<Row[]>("/api/admin/clients").then(setClients), []);
  useEffect(() => { load(); }, [load]);

  const shown = (clients || []).filter((c) => `${c.name} ${c.email || ""}`.toLowerCase().includes(q.toLowerCase()));
  const addBtn = <button className="btn-primary" onClick={() => setEditing(null)} data-testid="add-client-button"><Plus className="h-4 w-4" /> Add client</button>;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={`Directory · ${clients?.length ?? "—"}`} title="Clients" action={addBtn} />
      {clients && clients.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" className="field pl-11" data-testid="client-search-input" />
        </div>
      )}
      {clients && !clients.length && <Empty title="No clients yet" text="Clients are the people you deliver galleries to." action={addBtn} testId="clients-empty" />}
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200" data-testid="client-list">
        {shown.map((c) => (
          <li key={c.id} className="group flex flex-wrap items-center gap-x-8 gap-y-2 bg-surface px-2 py-6 transition-colors hover:bg-neutral-50 sm:px-4" data-testid="client-row">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-2xl" data-testid="client-row-name">{c.name}</p>
              {c.email && <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600"><Mail className="h-3.5 w-3.5" />{c.email}</p>}
              {c.notes && <p className="mt-2 line-clamp-2 max-w-xl text-sm text-neutral-500">{c.notes}</p>}
            </div>
            <div className="text-right">
              <p className="caption">{c._count.galleries} galleries</p>
              <p className="caption mt-1">Since {formatDate(c.createdAt)}</p>
            </div>
            <button className="btn-secondary px-4 py-2" onClick={() => setEditing(c)} data-testid="client-edit-button"><Pencil className="h-3.5 w-3.5" /> Edit</button>
          </li>
        ))}
      </ul>
      <ClientDialog client={editing} onClose={() => setEditing(undefined)} onSaved={load} />
    </div>
  );
}
