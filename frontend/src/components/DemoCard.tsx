import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSettings } from "@/lib/db";

// Shown on the login and setup screens when DEMO_MODE=true, so visitors can try the client view.
export async function DemoCard() {
  if (process.env.DEMO_MODE !== "true") return null;
  const s = await getSettings();
  if (!s.demoSlug || !s.demoPassword) return null;
  return (
    <div className="mt-10 border border-neutral-200 bg-surface p-5" data-testid="demo-card">
      <p className="caption flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Demo mode</p>
      <p className="mt-3 text-sm text-neutral-700">Try the client experience with a sample wedding gallery.</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="caption pt-0.5">Gallery</dt>
        <dd><Link href={`/g/${s.demoSlug}`} className="underline underline-offset-4" data-testid="demo-gallery-link">/g/{s.demoSlug}</Link></dd>
        <dt className="caption pt-0.5">Password</dt>
        <dd className="font-mono" data-testid="demo-password">{s.demoPassword}</dd>
      </dl>
    </div>
  );
}
