"use client";
import { Check } from "lucide-react";
import { accentVars } from "@/lib/accent";

export const ACCENT_PRESETS = [
  { name: "Charcoal", hex: "#18181B" },
  { name: "Terracotta", hex: "#C85A32" },
  { name: "Sage", hex: "#4A6B5D" },
  { name: "Midnight", hex: "#1B2A4A" },
  { name: "Bronze", hex: "#A38258" },
];

export function AccentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const same = (hex: string) => value.toLowerCase() === hex.toLowerCase();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3" data-testid="studio-accent-picker">
        {ACCENT_PRESETS.map((p) => (
          <button type="button" key={p.hex} title={p.name} aria-label={p.name} onClick={() => onChange(p.hex)} data-testid={`accent-preset-${p.name.toLowerCase()}`}
            className={`flex h-10 w-10 items-center justify-center border border-black/10 ring-offset-2 ring-offset-surface transition-shadow dark:border-white/25 ${same(p.hex) ? "ring-1 ring-neutral-900" : ""}`} style={{ background: p.hex }}>
            {same(p.hex) && <Check className="h-4 w-4 text-white" />}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 border border-neutral-300 bg-surface px-3 py-2">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#18181b"} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" data-testid="accent-color-input" />
          <input value={value} onChange={(e) => onChange(e.target.value)} className="w-20 font-mono text-xs uppercase outline-none" maxLength={7} aria-label="Hex color" data-testid="accent-hex-input" />
        </label>
      </div>
      <div className="mt-6 flex items-center gap-4 border border-neutral-200 bg-surface p-5" data-testid="accent-preview">
        <span className="accent-scope btn-primary px-5 py-2.5" style={accentVars(value)}>Download all</span>
        <span className="text-sm text-neutral-600">This is how buttons look in your client galleries.</span>
      </div>
    </div>
  );
}
