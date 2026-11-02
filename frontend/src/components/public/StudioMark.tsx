export type Brand = { studioName: string; hasLogo: boolean; accent: string };

export function StudioMark({ brand, className = "" }: { brand: Brand; className?: string }) {
  if (brand.hasLogo) return <img src="/api/logo" alt={brand.studioName} className={`max-h-10 w-auto object-contain dark:bg-white/90 dark:p-1 ${className}`} data-testid="studio-logo" />;
  return <span className={`font-serif text-lg uppercase tracking-[0.35em] ${className}`} data-testid="studio-name">{brand.studioName}</span>;
}
