"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Modal } from "./Modal";
import { ClientSelect } from "./ClientSelect";

export function NewGalleryDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ title: "", clientId: "", password: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setForm({ title: "", clientId: "", password: "" }); }, [open]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const g = await api<{ id: string }>("/api/admin/galleries", { method: "POST", body: form });
      toast.success("Gallery created");
      onCreated(g.id);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New gallery" testId="new-gallery-modal">
      <form onSubmit={create} className="space-y-5">
        <div>
          <label className="label" htmlFor="g-title">Title</label>
          <input id="g-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" placeholder="Hannah & Theo — Wedding" data-testid="gallery-title-input" />
        </div>
        <ClientSelect value={form.clientId} onChange={(clientId) => setForm({ ...form, clientId })} />
        <div>
          <label className="label" htmlFor="g-pass">Password <span className="normal-case tracking-normal text-neutral-400">(optional)</span></label>
          <input id="g-pass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" placeholder="Leave blank for link-only access" data-testid="gallery-password-input" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary" data-testid="gallery-create-submit">{busy ? "Creating…" : "Create gallery"}</button>
        </div>
      </form>
    </Modal>
  );
}
