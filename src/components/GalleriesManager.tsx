"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { api } from "@/lib/client-api";
import { PageHeader, Empty } from "./PageHeader";
import { GalleryCard } from "./GalleryCard";
import { NewGalleryDialog } from "./NewGalleryDialog";

type Row = { id: string; slug: string; title: string; createdAt: string; client: { name: string } | null; _count: { photos: number }; coverId: string | null; hasPassword: boolean; unread: number };

export function GalleriesManager() {
  const params = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(params.get("new") === "1");
  useEffect(() => { api<Row[]>("/api/admin/galleries").then(setRows); }, []);

  const btn = <button className="btn-primary" onClick={() => setOpen(true)} data-testid="create-gallery-button"><Plus className="h-4 w-4" /> New gallery</button>;
  return (
    <div className="max-w-6xl">
      <PageHeader eyebrow={`Collections · ${rows?.length ?? "—"}`} title="Galleries" action={btn} />
      {rows && !rows.length && <Empty title="No galleries yet" text="Create a gallery for a client, upload photos and share a private link." action={btn} testId="galleries-empty" />}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" data-testid="gallery-list">
        {rows?.map((g) => (
          <GalleryCard key={g.id} g={{ ...g, clientName: g.client?.name, count: g._count.photos }} />
        ))}
      </div>
      <NewGalleryDialog open={open} onClose={() => setOpen(false)} onCreated={(id) => router.push(`/admin/galleries/${id}`)} />
    </div>
  );
}
