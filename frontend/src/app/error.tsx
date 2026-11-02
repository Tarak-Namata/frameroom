"use client";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="flex min-h-[70vh] flex-col justify-center px-8 sm:px-20" data-testid="error-page">
      <p className="caption">Something went wrong</p>
      <h1 className="mt-4 font-serif text-4xl font-light sm:text-5xl">We hit a snag loading this page.</h1>
      <p className="mt-4 max-w-md text-sm text-neutral-600">It's not you — please try again. If it keeps happening, restarting Frameroom from your hosting panel usually fixes it.</p>
      <div className="mt-8"><button onClick={reset} className="btn-primary" data-testid="error-retry-button"><RotateCcw className="h-4 w-4" /> Try again</button></div>
    </main>
  );
}
