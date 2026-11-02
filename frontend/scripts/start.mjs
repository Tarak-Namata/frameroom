// Prepares the database then starts Next.js (dev unless NODE_ENV=production). Zero config needed.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma.mjs";

const dataDir = path.resolve(process.env.DATA_DIR || "./data");
try {
  mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
} catch {
  console.error(`\n✖ Frameroom can't create its data folder at ${dataDir}. Make sure the data volume is mounted and writable.\n`);
  process.exit(1);
}
process.env.DATABASE_URL ||= `file:${path.join(dataDir, "frameroom.db")}`;

if (process.env.STORAGE_DRIVER === "s3") {
  const missing = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !process.env[k]);
  if (missing.length) console.warn(`\n⚠ STORAGE_DRIVER=s3 is set but ${missing.join(", ")} missing — uploads will fail until you add them.\n`);
}
if (!process.env.APP_URL) console.log("ℹ APP_URL is not set — share links will use the address you open Frameroom from. You can change it later in Settings → General.");

const dbHint = process.env.DATABASE_URL.startsWith("postgres")
  ? "Frameroom couldn't connect to your Postgres database. Check DATABASE_URL (user, password, host and database name) and that the database is running."
  : `Frameroom couldn't open its database file in ${dataDir}. Make sure the data volume is writable.`;
prisma(["generate"], "Frameroom couldn't prepare its database client. Try reinstalling dependencies (yarn install).");
prisma(["db", "push", "--skip-generate"], dbHint);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";
const child = spawn("npx", ["next", prod ? "start" : "dev", "-p", port, "-H", host], { stdio: "inherit", env: process.env });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
