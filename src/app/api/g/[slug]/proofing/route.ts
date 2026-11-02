import { db } from "@/lib/db";
import { fail, json, readJson, str } from "@/lib/http";
import { safe } from "@/lib/errors";
import { canView, getGalleryBySlug } from "@/lib/gallery-access";
import { getMySelection, rememberSelection, toState } from "@/lib/proofing";

type Ctx = { params: Promise<{ slug: string }> };

async function gallery(slug: string) {
  const g = await getGalleryBySlug(slug);
  return g && (await canView(g)) ? g : null;
}

export const GET = safe(async (_req: Request, { params }: Ctx) => {
  const g = await gallery((await params).slug);
  if (!g) return fail("This gallery isn't available.", 404);
  return json(toState(g.maxSelections, await getMySelection(g.id)));
});

// Client enters name + email once; re-using the same email picks up their earlier selection.
export const POST = safe(async (req: Request, { params }: Ctx) => {
  const g = await gallery((await params).slug);
  if (!g) return fail("This gallery isn't available.", 404);
  const b = await readJson<{ name: string; email: string }>(req);
  const name = str(b.name, 100);
  const email = str(b.email, 200).toLowerCase();
  if (!name) return fail("Please enter your name so your photographer knows who you are.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email address, like you@example.com.");
  const sel = await db.selection.upsert({
    where: { galleryId_clientEmail: { galleryId: g.id, clientEmail: email } },
    update: { clientName: name },
    create: { galleryId: g.id, clientName: name, clientEmail: email },
    include: { items: true },
  });
  await rememberSelection(g.id, sel.id);
  return json(toState(g.maxSelections, sel));
});
