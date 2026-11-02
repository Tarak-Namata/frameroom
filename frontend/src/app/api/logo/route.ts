import { getSettings } from "@/lib/db";
import { storage, streamResponse } from "@/lib/storage";

export async function GET() {
  const s = await getSettings();
  if (!s.logoKey) return new Response("Not found", { status: 404 });
  try {
    return streamResponse(await storage.get(s.logoKey), { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
