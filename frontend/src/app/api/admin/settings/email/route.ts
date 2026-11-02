import { db, getSettings, publicSettings } from "@/lib/db";
import { fail, json, readJson, requireUser, str } from "@/lib/http";
import { safe } from "@/lib/errors";
import { encrypt } from "@/lib/secrets";

type Body = { host: string; port: number | string; secure: boolean; user: string; password: string; from: string };

export const PUT = safe(async (req: Request) => {
  const { denied } = await requireUser();
  if (denied) return denied;
  const b = await readJson<Body>(req);
  const host = str(b.host, 255);
  const port = Number(b.port || 587);
  const from = str(b.from, 320);
  if (!host) return fail("Please enter your email server address, e.g. smtp.gmail.com.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) return fail("The port should be a number — usually 587 or 465.");
  if (!/^(.+<)?\S+@\S+\.\S+>?$/.test(from)) return fail("Please enter the From address, e.g. hello@yourstudio.com.");
  await getSettings();
  const password = typeof b.password === "string" ? b.password : "";
  const s = await db.settings.update({
    where: { id: 1 },
    data: { smtpHost: host, smtpPort: port, smtpSecure: !!b.secure, smtpUser: str(b.user, 320) || null, smtpFrom: from, ...(password ? { smtpPassEnc: encrypt(password) } : {}) },
  });
  return json(publicSettings(s).email);
});

export const DELETE = safe(async () => {
  const { denied } = await requireUser();
  if (denied) return denied;
  await getSettings();
  await db.settings.update({ where: { id: 1 }, data: { smtpHost: null, smtpPort: null, smtpSecure: false, smtpUser: null, smtpPassEnc: null, smtpFrom: null, lastEmailError: null, lastEmailErrorAt: null } });
  return json({ ok: true });
});
