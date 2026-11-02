import Link from "next/link";
import { Check } from "lucide-react";
import { db } from "@/lib/db";

// First-run checklist on the dashboard. Each step ticks itself off; the card disappears when all are done.
export async function GettingStarted() {
  const [clients, galleries, photos, selections] = await Promise.all([db.client.count(), db.gallery.count(), db.photo.count(), db.selection.count()]);
  const steps = [
    { done: clients > 0, title: "Add a client", text: "The person you're delivering photos to.", href: "/admin/clients" },
    { done: galleries > 0, title: "Create a gallery", text: "Optionally set a password or a max number of selections.", href: "/admin/galleries?new=1" },
    { done: photos > 0, title: "Upload photos", text: "Drag in a whole shoot. JPEG, PNG or WebP up to 25 MB each.", href: "/admin/galleries" },
    { done: selections > 0, title: "Share the link", text: "Copy the private link from the gallery and send it. Their picks show up here.", href: "/admin/galleries" },
  ];
  if (steps.every((s) => s.done)) return null;
  return (
    <section className="mb-12 animate-rise border border-neutral-200 bg-surface p-6 sm:p-8" data-testid="getting-started">
      <p className="caption">Getting started · {steps.filter((s) => s.done).length} / {steps.length}</p>
      <h2 className="mt-2 font-serif text-3xl font-light">Deliver your first gallery</h2>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} data-testid={`getting-started-step-${i + 1}`}>
            <Link href={s.href} className="group block h-full border border-neutral-200 p-4 transition-colors hover:border-neutral-900">
              <span className={`flex h-7 w-7 items-center justify-center border font-mono text-xs ${s.done ? "border-transparent bg-[var(--studio-accent)] text-[var(--studio-accent-fg)]" : "border-neutral-300 text-neutral-500"}`}>
                {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <p className={`mt-3 text-sm font-medium ${s.done ? "text-neutral-500 line-through" : ""}`}>{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{s.text}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
