import { db } from "@/lib/db";
import { json } from "@/lib/http";

// Used by Docker's HEALTHCHECK and hosting panels: 200 when the app and database respond.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return json({ status: "ok", database: "ok" });
  } catch {
    return json({ status: "error", database: "unreachable", message: "Frameroom is running but can't reach its database." }, 503);
  }
}
