// Studio accent as CSS variables. A very dark accent (e.g. charcoal) is swapped for a light
// tone in dark mode so buttons stay visible; text on the accent picks black or white for contrast.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const fg = (hex: string) => (luminance(hex) > 0.45 ? "#0a0a0a" : "#ffffff");

export function accentVars(hex: string): React.CSSProperties {
  const valid = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#18181B";
  const dark = luminance(valid) < 0.04 ? "#E7E5E4" : valid;
  return { ["--accent-l" as string]: valid, ["--accent-l-fg" as string]: fg(valid), ["--accent-d" as string]: dark, ["--accent-d-fg" as string]: fg(dark) };
}
