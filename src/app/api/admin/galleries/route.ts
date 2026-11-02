import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, json, readJson, requireUser, str } from "@/lib/http";
import { randomId } from "@/lib/images";

export async function GET() {
  const { denied } = await requireUser();
  if (denied) return denied;
  const galleries = await db.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { photos: true, selections: { where: { status: "submitted", seenAt: null } } } },
      photos: { take: 1, orderBy: { createdAt: "asc" }, select: { id: true } },
    },
  });
  return json(galleries.map(({ passwordHash, photos, ...g }) => ({ ...g, hasPassword: !!passwordHash, coverId: photos[0]?.id ?? null, unread: g._count.selections })));
}

export async function POST(req: Request) {
  const { denied } = await requireUser();
  if (denied) return denied;
  const b = await readJson<{ title: string; clientId: string; password: string }>(req);
  const title = str(b.title, 160);
  if (!title) return fail("Title is required");
  const clientId = str(b.clientId, 64) || null;
  if (clientId && !(await db.client.findUnique({ where: { id: clientId } }))) return fail("Client not found", 404);
  const password = typeof b.password === "string" ? b.password : "";
  if (password && password.length < 4) return fail("Password must be at least 4 characters");
  const gallery = await db.gallery.create({
    data: { title, clientId, slug: randomId(12), passwordHash: password ? await hashPassword(password) : null },
  });
  return json({ id: gallery.id, slug: gallery.slug, title: gallery.title }, 201);
}
