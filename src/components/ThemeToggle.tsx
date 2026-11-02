"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Light/dark switch. Defaults to the device setting; the choice is remembered in localStorage.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fr-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} data-testid="theme-toggle"
      className={`flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 ${className}`}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export const THEME_SCRIPT = `try{var t=localStorage.getItem('fr-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;
