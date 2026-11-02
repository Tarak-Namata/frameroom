"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "10vh 8vw", color: "#09090b", background: "#fafafa" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#71717a" }}>Frameroom</p>
        <h1 style={{ fontWeight: 300, fontSize: 40 }}>Frameroom couldn't start this page.</h1>
        <p style={{ maxWidth: 460, color: "#52525b" }}>Please try again in a moment. If this keeps happening, restart Frameroom from your hosting panel.</p>
        <button onClick={reset} style={{ marginTop: 24, padding: "12px 24px", background: "#18181b", color: "#fff", border: 0, cursor: "pointer" }}>Try again</button>
      </body>
    </html>
  );
}
