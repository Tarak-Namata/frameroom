// Runs a prisma command against the schema matching DATABASE_URL (sqlite default, postgres optional).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export function schemaPath() {
  loadEnvFile();
  process.env.DATABASE_URL ||= `file:${path.resolve(process.env.DATA_DIR || "./data", "frameroom.db")}`;
  return /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL) ? "prisma/postgres/schema.prisma" : "prisma/schema.prisma";
}

export function prisma(args, friendly) {
  const r = spawnSync("npx", ["prisma", ...args, "--schema", schemaPath()], { stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    if (friendly) console.error(`\n✖ ${friendly}\n`);
    process.exit(r.status ?? 1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv.slice(2);
  prisma(cmd.length ? cmd : ["generate"]);
}
