"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { Empty } from "../PageHeader";
import { EmailBanner } from "./EmailBanner";
import { SelectionCard, type AdminSelection } from "./SelectionCard";

type Data = { slug: string; maxSelections: number | null; selections: AdminSelection[] };

export function SelectionsPanel({ galleryId, onSeen }: { galleryId: string; onSeen: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const load = useCallback(() => api<Data>(`/api/admin/galleries/${galleryId}/selections`).then((d) => { setData(d); onSeen(); }), [galleryId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  if (!data) return <p className="caption">Loading…</p>;
  return (
    <div className="space-y-8" data-testid="selections-panel">
      <EmailBanner />
      <p className="text-sm text-neutral-600" data-testid="selections-mode">
        {data.maxSelections ? `Clients can pick up to ${data.maxSelections} photos.` : "No limit — clients can heart as many favorites as they like."} Change this under Photos → Details.
      </p>
      {data.selections.length ? (
        data.selections.map((s) => <SelectionCard key={s.id} s={s} slug={data.slug} max={data.maxSelections} onChange={load} />)
      ) : (
        <Empty title="No selections yet" text="When your client opens the gallery link, they can heart photos, leave comments and submit their picks. They'll show up here." testId="selections-empty" />
      )}
    </div>
  );
}
