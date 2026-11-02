import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSettings } from "@/lib/db";
import { hasOwner } from "@/lib/auth";
import { REPO_URL } from "@/lib/repo";

// Shown on the login and setup screens when DEMO_MODE=true, so anyone can try Frameroom unaided.
export async function DemoCard() {
  if (process.env.DEMO_MODE !== "true") return null;
  const s = await getSettings();
  if (!s.demoSlug || !s.demoPassword) return null;
  const claimed = await hasOwner();
  return (
    <div className="mt-10 border border-neutral-200 bg-surface p-5" data-testid="demo-card">
      <p className="caption flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Demo mode — try it yourself</p>
      <ol className="mt-4 space-y-3 text-sm text-neutral-700">
        <li>
          <span className="font-medium">1. See what your clients see.</span> Open the sample wedding gallery, heart a few photos, leave a comment and submit.
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="caption pt-0.5">Gallery</dt>
            <dd><Link href={`/g/${s.demoSlug}`} className="underline underline-offset-4" data-testid="demo-gallery-link">/g/{s.demoSlug}</Link></dd>
            <dt className="caption pt-0.5">Password</dt>
            <dd className="font-mono" data-testid="demo-password">{s.demoPassword}</dd>
          </dl>
        </li>
        <li data-testid="demo-owner-step">
          <span className="font-medium">2. See the photographer side.</span>{" "}
          {claimed
            ? <>The owner account on this demo has already been created. To explore the admin side yourself, <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">install your own copy</a> (one click on Hostinger, or Docker).</>
            : <>Create any account above. You&apos;ll land in the sample studio, where the selections and CSV export are ready to try.</>}
        </li>
      </ol>
    </div>
  );
}
