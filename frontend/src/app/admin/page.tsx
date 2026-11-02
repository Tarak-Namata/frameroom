import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { PageHeader, Empty } from "@/components/PageHeader";
import { GalleryCard } from "@/components/GalleryCard";
import { EmailBanner } from "@/components/selections/EmailBanner";
import { NewSelections } from "@/components/selections/NewSelections";
import { GettingStarted } from "@/components/GettingStarted";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getUser();
  const [galleries, clients, photos, agg, recent] = await Promise.all([
    db.gallery.count(),
    db.client.count(),
    db.photo.count(),
    db.photo.aggregate({ _sum: { size: true } }),
    db.gallery.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } }, _count: { select: { photos: true, selections: { where: { status: "submitted", seenAt: null } } } }, photos: { take: 1, orderBy: { createdAt: "asc" }, select: { id: true } } },
    }),
  ]);
  const stats = [
    { label: "Galleries", value: galleries, id: "stat-galleries" },
    { label: "Clients", value: clients, id: "stat-clients" },
    { label: "Photos", value: photos, id: "stat-photos" },
    { label: "Originals stored", value: `${((agg._sum.size || 0) / 1048576).toFixed(1)} MB`, id: "stat-storage" },
  ];
  return (
    <div className="max-w-6xl">
      <PageHeader eyebrow="Overview" title={`Hello, ${user?.name.split(" ")[0]}.`}
        action={<Link href="/admin/galleries?new=1" className="btn-primary" data-testid="dashboard-new-gallery-button">New gallery</Link>} />
      <div className="mb-8"><EmailBanner /></div>
      <GettingStarted />
      <NewSelections />
      <div className="grid grid-cols-2 border-l border-t border-neutral-200 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="animate-rise border-b border-r border-neutral-200 bg-surface p-6" style={{ animationDelay: `${i * 60}ms` }}>
            <p className="caption">{s.label}</p>
            <p className="mt-4 font-serif text-4xl font-light" data-testid={s.id}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-6 mt-16 flex items-baseline justify-between">
        <h2 className="font-serif text-3xl font-light">Recent galleries</h2>
        <Link href="/admin/galleries" className="btn-ghost">All galleries <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      {recent.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((g) => (
            <GalleryCard key={g.id} g={{ id: g.id, slug: g.slug, title: g.title, createdAt: g.createdAt.toISOString(), clientName: g.client?.name, count: g._count.photos, coverId: g.photos[0]?.id, hasPassword: !!g.passwordHash, unread: g._count.selections }} />
          ))}
        </div>
      ) : (
        <Empty title="No galleries yet" text="Add a client, create a gallery and upload your first set of photos." testId="dashboard-empty" />
      )}
    </div>
  );
}
