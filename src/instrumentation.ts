// Next.js calls register() once when the server starts. Node-only work must sit inside the
// NEXT_RUNTIME check so it is left out of the edge bundle.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
