import { Aperture } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { REPO_URL } from "@/lib/repo";

export const TAGLINE = "Your studio's gallery and proofing, self-hosted, no subscription.";

type Props = { eyebrow: string; title: string; subtitle: string; children: React.ReactNode; extra?: React.ReactNode };

export function AuthLayout({ eyebrow, title, subtitle, children, extra }: Props) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-neutral-200 lg:block">
        <img src="/auth-cover.jpg" alt="" className="absolute inset-0 h-full w-full animate-fade object-cover" />
        <div className="absolute bottom-10 left-10 text-white">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">Frameroom · Open source</p>
          <p className="mt-3 max-w-sm font-serif text-3xl font-light leading-tight" data-testid="tagline">{TAGLINE}</p>
        </div>
      </section>
      <section className="flex flex-col justify-between px-6 py-10 sm:px-14 lg:px-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-xl tracking-[0.3em]">
            <Aperture className="h-5 w-5" strokeWidth={1.25} /> FRAMEROOM
          </div>
          <ThemeToggle />
        </div>
        <p className="mt-6 font-serif text-lg font-light leading-snug text-neutral-600 lg:hidden" data-testid="tagline-mobile">{TAGLINE}</p>
        <div className="w-full max-w-md animate-rise py-12">
          <p className="caption">{eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{subtitle}</p>
          <div className="mt-10">{children}</div>
          {extra}
        </div>
        <p className="caption">MIT licensed · self-hosted · no subscription · <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-neutral-900 hover:underline" data-testid="footer-repo-link">GitHub</a></p>
      </section>
    </main>
  );
}
