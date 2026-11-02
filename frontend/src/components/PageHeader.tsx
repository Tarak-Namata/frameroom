export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="mb-10 flex animate-rise flex-wrap items-end justify-between gap-6 border-b border-neutral-200 pb-8">
      <div>
        <p className="caption">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl" data-testid="page-title">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function Empty({ title, text, action, testId }: { title: string; text: string; action?: React.ReactNode; testId?: string }) {
  return (
    <div className="border border-dashed border-neutral-300 px-8 py-16" data-testid={testId}>
      <p className="font-serif text-2xl font-light">{title}</p>
      <p className="mt-2 max-w-md text-sm text-neutral-600">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
