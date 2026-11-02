"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Aperture, GalleryHorizontalEnd, LayoutGrid, LogOut, Settings, Users } from "lucide-react";
import { api } from "@/lib/client-api";
import { ThemeToggle } from "./ThemeToggle";
import { REPO_URL } from "@/lib/repo";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, id: "nav-dashboard" },
  { href: "/admin/galleries", label: "Galleries", icon: GalleryHorizontalEnd, id: "nav-galleries" },
  { href: "/admin/clients", label: "Clients", icon: Users, id: "nav-clients" },
  { href: "/admin/settings", label: "Settings", icon: Settings, id: "nav-settings" },
];

export function AdminNav({ studioName, userName, unread }: { studioName: string; userName: string; unread: number }) {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { router.refresh(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-neutral-200 bg-surface/80 px-5 py-3 backdrop-blur-lg lg:h-screen lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:px-6 lg:py-10">
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 font-serif text-lg tracking-[0.3em]"><Aperture className="h-4 w-4" strokeWidth={1.25} /> FRAMEROOM</div>
        <p className="caption mt-2 truncate" data-testid="nav-studio-name">{studioName}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto lg:mt-14 lg:flex-col">
        {items.map(({ href, label, icon: Icon, id }) => (
          <Link key={href} href={href} data-testid={id}
            className={`flex items-center gap-3 whitespace-nowrap px-3 py-2.5 text-sm transition-colors ${active(href) ? "bg-neutral-900 text-neutral-50" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"}`}>
            <Icon className="h-4 w-4" strokeWidth={1.5} /> <span className="hidden sm:inline">{label}</span>
            {id === "nav-galleries" && unread > 0 && <span className="ml-auto bg-[var(--studio-accent)] px-1.5 font-mono text-[10px] text-[var(--studio-accent-fg)]" data-testid="nav-unread-badge">{unread}</span>}
          </Link>
        ))}
      </nav>
      <div className="lg:mt-auto">
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="caption mb-4 hidden hover:text-neutral-900 lg:block" data-testid="nav-repo-link">Frameroom on GitHub</a>
        <p className="mb-3 hidden truncate text-sm text-neutral-600 lg:block">{userName}</p>
        <div className="flex items-center gap-1">
          <button onClick={logout} className="btn-ghost px-3" data-testid="nav-logout"><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span></button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
