export function StatusBadge({ on, label, testId }: { on: boolean; label?: string; testId: string }) {
  return (
    <span data-testid={testId} className={`inline-flex shrink-0 items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${on ? "border-green-800/30 text-green-800" : "border-neutral-300 text-neutral-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-green-700" : "bg-neutral-400"}`} />
      {label || (on ? "Connected" : "Not set up")}
    </span>
  );
}
