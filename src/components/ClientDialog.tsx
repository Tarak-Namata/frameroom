"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Modal } from "./Modal";

export type Client = { id: string; name: string; email: string | null; notes: string | null };

export function ClientDialog({ client, onClose, onSaved }: { client: Client | null | undefined; onClose: () => void; onSaved: (c: Client) => void }) {
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (client !== undefined) setForm({ name: client?.name || "", email: client?.email || "", notes: client?.notes || "" });
  }, [client]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await api<Client>(client ? `/api/admin/clients/${client.id}` : "/api/admin/clients", { method: client ? "PATCH" : "POST", body: form });
      toast.success(client ? "Client updated" : "Client added");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!client || !confirm(`Delete ${client.name}? Their galleries are kept but unassigned.`)) return;
    await api(`/api/admin/clients/${client.id}`, { method: "DELETE" });
    toast.success("Client deleted");
    onSaved(client);
    onClose();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal open={client !== undefined} onClose={onClose} title={client ? "Edit client" : "New client"} testId="client-form-modal">
      <form onSubmit={save} className="space-y-5">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" required value={form.name} onChange={set("name")} className="field" data-testid="client-name-input" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" type="email" value={form.email} onChange={set("email")} className="field" data-testid="client-email-input" />
        </div>
        <div>
          <label className="label" htmlFor="c-notes">Notes</label>
          <textarea id="c-notes" rows={4} value={form.notes} onChange={set("notes")} className="field resize-none" placeholder="Wedding on June 12 · prefers natural edits" data-testid="client-notes-input" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          {client && <button type="button" onClick={remove} className="btn-ghost mr-auto text-red-800 hover:bg-red-50" data-testid="client-delete-button">Delete</button>}
          <button type="button" onClick={onClose} className="btn-secondary" data-testid="client-cancel-button">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary" data-testid="client-save-button">{busy ? "Saving…" : "Save client"}</button>
        </div>
      </form>
    </Modal>
  );
}
