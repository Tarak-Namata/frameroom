import { cookies } from "next/headers";
import { db, getSettings } from "./db";
import { cookieOpts } from "./auth";
import { sign, verify } from "./session";
import { publicBaseUrl } from "./config";
import { friendlySmtpError, sendEmail, smtpConfigured } from "./email";

const TTL = 60 * 60 * 24 * 180;
const cookieName = (galleryId: string) => `fr_pr_${galleryId}`;

export type ProofItem = { photoId: string; hearted: boolean; comment: string | null };
export type ProofState = {
  maxSelections: number | null;
  me: { name: string; email: string; status: string; items: ProofItem[] } | null;
};

export async function getMySelection(galleryId: string) {
  const p = await verify<{ sid: string; gid: string }>((await cookies()).get(cookieName(galleryId))?.value);
  if (!p || p.gid !== galleryId) return null;
  return db.selection.findFirst({ where: { id: p.sid, galleryId }, include: { items: true } });
}

export async function rememberSelection(galleryId: string, selectionId: string) {
  (await cookies()).set(cookieName(galleryId), await sign({ sid: selectionId, gid: galleryId }, TTL), await cookieOpts(TTL));
}

type Sel = NonNullable<Awaited<ReturnType<typeof getMySelection>>>;

export function toState(maxSelections: number | null, sel: Sel | null): ProofState {
  return {
    maxSelections,
    me: sel && {
      name: sel.clientName,
      email: sel.clientEmail,
      status: sel.status,
      items: sel.items.filter((i) => i.hearted || i.comment).map((i) => ({ photoId: i.photoId, hearted: i.hearted, comment: i.comment })),
    },
  };
}

export const heartCount = (selectionId: string) => db.selectionItem.count({ where: { selectionId, hearted: true } });

// Email is a bonus: failures are logged to Settings and never affect the submission.
export async function notifyOwner(selectionId: string, req: Request) {
  const s = await getSettings();
  if (!smtpConfigured(s)) return;
  const sel = await db.selection.findUnique({ where: { id: selectionId }, include: { gallery: true, items: { where: { hearted: true } } } });
  const owner = await db.user.findFirst();
  if (!sel || !owner) return;
  const link = `${publicBaseUrl(s.appUrl, req)}/admin/galleries/${sel.galleryId}?tab=selections`;
  const n = sel.items.length;
  try {
    await sendEmail(s, {
      to: owner.email,
      subject: `${sel.clientName} submitted ${n} selection${n === 1 ? "" : "s"} — ${sel.gallery.title}`,
      text: `${sel.clientName} (${sel.clientEmail}) just submitted ${n} selected photo${n === 1 ? "" : "s"} from “${sel.gallery.title}”.\n\nSee their picks and comments:\n${link}\n\n— Frameroom`,
    });
    if (s.lastEmailError) await db.settings.update({ where: { id: 1 }, data: { lastEmailError: null, lastEmailErrorAt: null } });
  } catch (e) {
    console.error("[frameroom] selection email failed:", (e as { code?: string })?.code || e);
    await db.settings.update({
      where: { id: 1 },
      data: { lastEmailError: `We couldn't email you about ${sel.clientName}'s selections for “${sel.gallery.title}”. ${friendlySmtpError(e)}`, lastEmailErrorAt: new Date() },
    });
  }
}
