// Startup tasks that need Node.js (file system, sharp). Loaded only by instrumentation.ts.
import { seedDemo } from "./lib/demo-seed";

if (process.env.DEMO_MODE === "true") {
  seedDemo().catch((e) => console.error("[frameroom] The demo seed failed:", e));
}
