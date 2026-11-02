"use client";
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { uploadWithProgress } from "@/lib/client-api";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 25 * 1024 * 1024;
const CONCURRENCY = 3;

export function Uploader({ galleryId, onUploaded }: { galleryId: string; onUploaded: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; pct: Record<string, number> } | null>(null);

  async function handle(list: FileList | null) {
    const all = Array.from(list || []);
    const files = all.filter((f) => {
      const bad = !TYPES.includes(f.type) ? "this file type isn't supported. Please upload JPEG, PNG or WebP photos." : f.size > MAX ? "this photo is larger than 25 MB. Please export a smaller version." : "";
      if (bad) toast.error(`${f.name}: ${bad}`);
      return !bad;
    });
    if (!files.length) return;
    const pct: Record<string, number> = {};
    let done = 0, failed = 0;
    setProgress({ done, total: files.length, pct });
    const queue = [...files.entries()];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [i, f] = item;
        const form = new FormData();
        form.append("files", f);
        const url = `/api/admin/galleries/${galleryId}/photos`;
        const onProgress = (p: number) => { pct[i] = p; setProgress({ done, total: files.length, pct: { ...pct } }); };
        try {
          // One automatic retry covers brief network hiccups during long batches.
          await uploadWithProgress(url, form, onProgress).catch((e) => (/connection|restarting|took too long/i.test(e.message) ? uploadWithProgress(url, form, onProgress) : Promise.reject(e)));
        } catch (e) {
          failed++;
          toast.error((e as Error).message);
        }
        pct[i] = 100;
        done++;
        setProgress({ done, total: files.length, pct: { ...pct } });
        onUploaded(); // show each photo as soon as it's ready
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    if (done - failed) toast.success(`${done - failed} photo${done - failed > 1 ? "s" : ""} uploaded`);
    setProgress(null);
    if (input.current) input.current.value = "";
    onUploaded();
  }

  const overall = progress ? Math.round(Object.values(progress.pct).reduce((a, b) => a + b, 0) / progress.total) : 0;
  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-start border-2 border-dashed p-10 transition-colors ${drag ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 bg-surface hover:border-neutral-800"}`}
        data-testid="dropzone">
        <UploadCloud className="h-6 w-6 text-neutral-500" strokeWidth={1.25} />
        <p className="mt-4 font-serif text-2xl font-light">Drop photos here, or click to browse</p>
        <p className="caption mt-2">JPEG · PNG · WebP — up to 25 MB each</p>
        <input ref={input} type="file" multiple accept={TYPES.join(",")} className="sr-only" onChange={(e) => handle(e.target.files)} disabled={!!progress} data-testid="dropzone-input" />
      </label>
      {progress && (
        <div className="mt-4" data-testid="upload-progress">
          <div className="mb-2 flex justify-between caption"><span>Uploading {progress.done} / {progress.total}</span><span>{overall}%</span></div>
          <div className="h-[2px] w-full bg-neutral-200"><div className="h-full bg-[var(--studio-accent)] transition-[width] duration-300" style={{ width: `${overall}%` }} /></div>
        </div>
      )}
    </div>
  );
}
