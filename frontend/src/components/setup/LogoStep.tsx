"use client";
import { ArrowRight } from "lucide-react";
import { LogoField } from "../LogoField";

export function LogoStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-8" data-testid="setup-logo-step">
      <LogoField initialHasLogo={false} />
      <div className="flex items-center gap-3">
        <button onClick={onDone} className="btn-primary" data-testid="setup-logo-next">Continue <ArrowRight className="h-4 w-4" /></button>
        <button onClick={onDone} className="btn-ghost" data-testid="setup-logo-skip">Skip for now</button>
      </div>
    </div>
  );
}
