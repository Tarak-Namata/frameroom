import Link from "next/link";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/client-api";

export async function NewSelections() {
  const rows = await db.selection.findMany({
    where: { status: "submitted", seenAt: null },
    orderBy: { submittedAt: "desc" },
    include: { gallery: { select: { id: true, title: true } }, _count: { select: { items: { where: { hearted: true } } } } },
  });
  if (!rows.length) return null;
  return (
    <section className="mb-12 animate-rise" data-testid="new-selections">
      <h2 className="mb-4 flex items-center gap-3 font-serif text-3xl font-light">
        New selections <span className="bg-[var(--studio-accent)] px-2 py-0.5 font-mono text-xs text-[var(--studio-accent-fg)]" data-testid="new-selections-count">{rows.length}</span>
      </h2>
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200 bg-surface">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/galleries/${r.gallery.id}?tab=selections`} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50" data-testid="new-selection-item">
              <Heart className="h-4 w-4 shrink-0 fill-[var(--studio-accent)] text-[var(--studio-accent)]" />
              <span className="min-w-0 flex-1 truncate text-sm"><strong className="font-semibold">{r.clientName}</strong> submitted {r._count.items} photo{r._count.items === 1 ? "" : "s"} from <em className="font-serif text-base not-italic">{r.gallery.title}</em></span>
              {r.submittedAt && <span className="caption hidden shrink-0 sm:inline">{formatDate(r.submittedAt)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
