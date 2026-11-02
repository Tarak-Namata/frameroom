"use client";
import { useMemo, useState } from "react";
import { Download, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/client-api";
import { useProofing, type ProofState } from "@/lib/use-proofing";
import { StudioMark, type Brand } from "./StudioMark";
import { Lightbox, type PublicPhoto } from "./Lightbox";
import { HeartButton } from "./HeartButton";
import { ProofBar } from "./ProofBar";
import { IdentifyModal } from "./IdentifyModal";
import { ThemeToggle } from "../ThemeToggle";
import { REPO_URL } from "@/lib/repo";

type Props = { slug: string; title: string; clientName: string | null; date: string; photos: PublicPhoto[]; brand: Brand; proofing: ProofState };

export function ClientGallery({ slug, title, clientName, date, photos, brand, proofing }: Props) {
  const p = useProofing(slug, proofing);
  const [index, setIndex] = useState<number | null>(null);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const src = (id: string, v: string) => `/api/g/${slug}/photos/${id}?v=${v}`;
  const shown = useMemo(() => (onlyFavs ? photos.filter((ph) => p.items.get(ph.id)?.hearted) : photos), [onlyFavs, photos, p.items]);
  const cover = photos[0];

  return (
    <main className="min-h-screen bg-paper pb-24">
      <section className="relative" data-testid="client-gallery-hero">
        {cover && (
          <div className="relative h-[55vh] min-h-[320px] overflow-hidden bg-neutral-200 sm:h-[78vh]">
            <img src={src(cover.id, "large")} alt={cover.filename} className="h-full w-full animate-fade object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
          </div>
        )}
        <div className={`${cover ? "absolute inset-x-0 bottom-0 text-white" : "pt-24"} px-5 pb-8 sm:px-12 sm:pb-10 lg:px-20`}>
          <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${cover ? "text-white/80" : "text-neutral-500"}`}>{clientName ? `${clientName} · ` : ""}{formatDate(date)}</p>
          <h1 className="mt-3 max-w-4xl animate-rise font-serif text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" data-testid="client-gallery-title">{title}</h1>
        </div>
      </section>
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-surface/85 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-12 lg:px-20">
          <StudioMark brand={brand} className="!max-h-8 !text-sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className="caption hidden sm:inline" data-testid="client-gallery-count">{photos.length} photos</span>
            {photos.length > 0 && (
              <a href={`/api/g/${slug}/download`} className="btn-secondary px-3 py-2 sm:px-5" data-testid="client-gallery-download-all-button">
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download all</span><span className="sm:hidden">All</span>
              </a>
            )}
          </div>
        </div>
      </div>
      <section className="px-1.5 py-4 sm:px-12 sm:py-10 lg:px-20">
        {p.state.maxSelections && !p.locked && (
          <p className="mb-4 px-2 text-sm text-neutral-600 sm:px-0" data-testid="proof-intro">Tap the heart on your {p.state.maxSelections} favorites, then press <strong>Submit selections</strong>.</p>
        )}
        {shown.length ? (
          <div className="flex flex-wrap gap-1.5 after:block after:flex-[10_1_0%] after:content-[''] sm:gap-4" data-testid="client-gallery-photo-grid">
            {shown.map((ph) => {
              const item = p.items.get(ph.id);
              return (
                <div key={ph.id} className="group relative basis-[calc(var(--r)*130px)] overflow-hidden bg-neutral-100 sm:basis-[calc(var(--r)*260px)]"
                  style={{ aspectRatio: `${ph.width} / ${ph.height}`, flexGrow: ph.width / ph.height, ["--r" as string]: ph.width / ph.height }} data-testid="client-gallery-photo-tile">
                  <button onClick={() => setIndex(photos.indexOf(ph))} className="block h-full w-full" aria-label={`Open ${ph.filename}`} data-testid="client-gallery-photo">
                    <img src={src(ph.id, "thumb")} alt={ph.filename} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]" />
                  </button>
                  <HeartButton on={!!item?.hearted} onClick={() => p.toggleHeart(ph.id)} className="absolute bottom-0 right-0" />
                  {item?.comment && <MessageSquare className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 fill-black/20 text-white drop-shadow" data-testid="photo-comment-indicator" />}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-2 py-20 font-serif text-2xl font-light text-neutral-500" data-testid="client-gallery-empty">{onlyFavs ? "No favorites yet — tap a heart to add one." : "Photos are on their way."}</p>
        )}
      </section>
      <footer className="px-5 pb-6 pt-6 sm:px-12 lg:px-20"><p className="caption">Delivered with <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-neutral-900 hover:underline" data-testid="footer-repo-link">Frameroom</a></p></footer>
      {photos.length > 0 && <ProofBar p={p} onlyFavs={onlyFavs} setOnlyFavs={setOnlyFavs} />}
      {index !== null && <Lightbox photos={photos} index={index} setIndex={setIndex} src={src} p={p} />}
      <IdentifyModal open={p.askIdentity} onClose={() => p.setAskIdentity(false)} onSubmit={p.identify} />
    </main>
  );
}
