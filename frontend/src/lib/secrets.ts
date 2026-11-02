import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { sessionSecret } from "./config";

const key = () => createHash("sha256").update(`frameroom-secrets:${sessionSecret()}`).digest();

export function encrypt(value: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(value, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(value: string) {
  const [iv, tag, data] = value.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
