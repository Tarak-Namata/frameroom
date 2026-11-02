import { db } from "@/lib/db";
import { fail, json, readJson, requireUser, str } from "@/lib/http";

export async function GET() {
  const { denied } = await requireUser();
  if (denied) return denied;
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { galleries: true } } } });
  return json(clients);
}

export async function POST(req: Request) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const b = await readJson<{ name: string; email: string; notes: string }>(req);
  const name = str(b.name, 120);
  if (!name) return fail("Name is required");
  const email = str(b.email, 200) || null;
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail("Email is invalid");
  const client = await db.client.create({ data: { name, email, notes: str(b.notes, 5000) || null } });
  return json(client, 201);
}
