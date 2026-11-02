import { db } from "@/lib/db";
import { fail, json, readJson, requireUser, str } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  const b = await readJson<{ name: string; email: string; notes: string }>(req);
  const name = str(b.name, 120);
  if (!name) return fail("Name is required");
  const email = str(b.email, 200) || null;
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail("Email is invalid");
  const exists = await db.client.findUnique({ where: { id } });
  if (!exists) return fail("Client not found", 404);
  const client = await db.client.update({ where: { id }, data: { name, email, notes: str(b.notes, 5000) || null } });
  return json(client);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const { id } = await params;
  await db.client.deleteMany({ where: { id } });
  return json({ ok: true });
}
