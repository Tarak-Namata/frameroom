import type { Config } from "tailwindcss";

// Neutrals and surfaces are CSS variables so the whole UI flips for dark mode (see globals.css).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const neutral = Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, v(`n-${n}`)]));

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        neutral,
        surface: v("surface"),
        paper: v("paper"),
        accent: "var(--studio-accent)",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        zoomin: { from: { opacity: "0", transform: "scale(0.98)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        rise: "rise 600ms cubic-bezier(.2,.7,.2,1) both",
        fade: "fade 200ms ease-out both",
        zoomin: "zoomin 250ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
