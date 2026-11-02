// Optional demo studio (DEMO_MODE=true). Runs once at startup and only on an empty install,
// so it can never touch a photographer's real data. Photos come from /demo-photos.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomInt } from "node:crypto";
import sharp from "sharp";
import { db, getSettings } from "./db";
import { hashPassword } from "./auth";
import { processImage, randomId } from "./images";
import { storage } from "./storage";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="160" viewBox="0 0 720 160">
  <circle cx="80" cy="80" r="52" fill="none" stroke="#A38258" stroke-width="6"/>
  <circle cx="80" cy="80" r="18" fill="#A38258"/>
  <text x="160" y="96" font-family="DejaVu Serif, Georgia, serif" font-size="54" letter-spacing="10" fill="#18181B">LUMEN &amp; CO.</text>
  <text x="163" y="132" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" letter-spacing="9" fill="#71717A">PHOTOGRAPHY</text>
</svg>`;

const GALLERIES = [
  {
    folder: "wedding", title: "Priya & Daniel — The Wedding", client: { name: "Priya & Daniel", email: "priya.daniel@example.com", notes: "Wedding · September at Lakeview Estate. Album: 30 photos." },
    maxSelections: 30, protected: true,
    picks: { by: { name: "Priya Sharma", email: "priya@example.com" }, hearts: [0, 2, 3, 5, 8, 11, 14], comments: { 2: "Love this one — can we have it in black & white too?", 8: "Please soften the background a little.", 11: "Cover of the album?" }, submitted: false },
  },
  {
    folder: "portraits", title: "The Okafor Family — Autumn Portraits", client: { name: "The Okafor Family", email: "okafor.family@example.com", notes: "Family portraits in the park. Two kids, one very excited dog." },
    maxSelections: null, protected: false,
    picks: { by: { name: "Adaeze Okafor", email: "adaeze@example.com" }, hearts: [0, 1, 3, 4, 6, 9, 10, 13, 16, 19], comments: { 3: "This is going on the living room wall!", 9: "Could you crop this one tighter?" }, submitted: true },
  },
  {
    folder: "brand", title: "Northwind Cafe — Brand Shoot", client: { name: "Northwind Cafe", email: "hello@northwind-cafe.example", notes: "Brand shoot for the new menu and website." },
    maxSelections: null, protected: false, picks: null,
  },
];

let running = false;

async function demoFiles(folder: string) {
  const dir = path.resolve(process.env.DEMO_PHOTOS_DIR || "./demo-photos", folder);
  const names = (await readdir(dir).catch(() => [])).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  return names.map((n) => path.join(dir, n));
}

export async function seedDemo() {
  if (running) return;
  running = true;
  const settings = await getSettings();
  if (settings.demoSeededAt) return;
  const [users, clients, galleries] = await Promise.all([db.user.count(), db.client.count(), db.gallery.count()]);
  if (users || clients || galleries) {
    console.log("[frameroom] DEMO_MODE is on, but this install already has data — skipping the demo seed.");
    return;
  }
  console.log("[frameroom] Seeding the demo studio “Lumen & Co. Photography”…");
  const created = { clients: [] as string[], galleries: [] as string[] };
  try {
    await seedContent(created);
  } catch (e) {
    // Roll back so the next start can retry cleanly instead of seeing a half-seeded "real" install.
    await db.gallery.deleteMany({ where: { id: { in: created.galleries } } }).catch(() => {});
    await db.client.deleteMany({ where: { id: { in: created.clients } } }).catch(() => {});
    throw e;
  } finally {
    running = false;
  }
}

async function seedContent(created: { clients: string[]; galleries: string[] }) {
  const logoKey = `branding/logo-${randomId(8)}.png`;
  await storage.put(logoKey, await sharp(Buffer.from(LOGO_SVG)).png().toBuffer(), "image/png");
  await db.settings.update({ where: { id: 1 }, data: { studioName: "Lumen & Co. Photography", accentColor: "#A38258", logoKey } });

  const password = `lumen-${randomInt(1000, 9999)}`;
  let demoSlug = "";
  for (const spec of GALLERIES) {
    const client = await db.client.create({ data: spec.client });
    created.clients.push(client.id);
    const gallery = await db.gallery.create({
      data: { title: spec.title, slug: randomId(12), clientId: client.id, maxSelections: spec.maxSelections, passwordHash: spec.protected ? await hashPassword(password) : null },
    });
    created.galleries.push(gallery.id);
    if (spec.protected) demoSlug = gallery.slug;
    const photoIds: string[] = [];
    for (const file of await demoFiles(spec.folder)) {
      const data = await processImage(gallery.id, await readFile(file), path.basename(file));
      photoIds.push((await db.photo.create({ data: { ...data, galleryId: gallery.id, filename: path.basename(file) } })).id);
    }
    if (spec.picks && photoIds.length) {
      const { by, hearts, comments, submitted } = spec.picks;
      const sel = await db.selection.create({
        data: { galleryId: gallery.id, clientName: by.name, clientEmail: by.email, status: submitted ? "submitted" : "open", submittedAt: submitted ? new Date() : null },
      });
      const indexes = new Set([...hearts, ...Object.keys(comments).map(Number)]);
      for (const i of indexes) {
        if (!photoIds[i]) continue;
        await db.selectionItem.create({
          data: { selectionId: sel.id, photoId: photoIds[i], hearted: hearts.includes(i), comment: (comments as Partial<Record<number, string>>)[i] ?? null },
        });
      }
    }
    console.log(`[frameroom]   ✓ ${spec.title} (${photoIds.length} photos)`);
  }
  await db.settings.update({ where: { id: 1 }, data: { demoSlug, demoPassword: password, demoSeededAt: new Date() } });
  console.log(`[frameroom] Demo ready. Protected gallery: /g/${demoSlug} — password: ${password}`);
}
