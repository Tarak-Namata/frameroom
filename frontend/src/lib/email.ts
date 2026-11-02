import nodemailer from "nodemailer";
import { decrypt } from "./secrets";
import { FriendlyError } from "./errors";

type Smtp = { smtpHost: string | null; smtpPort: number | null; smtpSecure: boolean; smtpUser: string | null; smtpPassEnc: string | null; smtpFrom: string | null };

const MESSAGES: Record<string, string> = {
  EAUTH: "Your email provider rejected the username or password. Many providers (Gmail, Outlook) need an “app password” instead of your normal one.",
  ECONNECTION: "Couldn't connect to the email server. Double-check the server address and port.",
  ETIMEDOUT: "The email server didn't respond in time. Check the server address and port (usually 587 or 465).",
  ESOCKET: "The connection to the email server dropped. Try switching the “Secure (SSL)” setting — it's usually on for port 465 and off for 587.",
  EDNS: "That email server address couldn't be found. Check for typos in the server address.",
  EENVELOPE: "The email server refused the From address or your address. Use a From address your provider allows.",
  EMESSAGE: "The email server refused the From address or your address. Use a From address your provider allows.",
};

export const friendlySmtpError = (e: unknown) =>
  e instanceof FriendlyError ? e.message : MESSAGES[String((e as { code?: string })?.code)] ?? "The email couldn't be sent. Check your email settings and try again.";

export const smtpConfigured = (s: Smtp) => !!(s.smtpHost && s.smtpFrom);

function decryptPassword(enc: string | null) {
  if (!enc) return undefined;
  try {
    return decrypt(enc);
  } catch {
    throw new FriendlyError("Your saved email password can't be read anymore (the server secret changed). Please enter it again and save.");
  }
}

export async function sendEmail(s: Smtp, msg: { to: string; subject: string; text: string }) {
  if (!smtpConfigured(s)) throw new FriendlyError("Save your email settings first.");
  const pass = decryptPassword(s.smtpPassEnc);
  const transport = nodemailer.createTransport({
    host: s.smtpHost!,
    port: s.smtpPort || 587,
    secure: s.smtpSecure,
    auth: s.smtpUser ? { user: s.smtpUser, pass } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  try {
    await transport.sendMail({ from: s.smtpFrom!, ...msg });
  } finally {
    transport.close();
  }
}

export function sendTestEmail(s: Smtp, to: string, studioName: string) {
  return sendEmail(s, {
    to,
    subject: `Frameroom test email for ${studioName}`,
    text: "Good news — your email settings work. Frameroom will email you when clients submit their selections.",
  });
}
