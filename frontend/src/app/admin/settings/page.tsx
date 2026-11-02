import { getSettings, publicSettings } from "@/lib/db";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import pkg from "../../../../package.json";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = publicSettings(await getSettings());
  const { tab } = await searchParams;
  // Non-sensitive details attached to "Report a problem" issues.
  const report = {
    "Frameroom version": pkg.version,
    Database: (process.env.DATABASE_URL || "").startsWith("postgres") ? "Postgres" : "SQLite",
    Storage: process.env.STORAGE_DRIVER === "s3" ? "S3-compatible" : "Local disk",
    "Email set up": s.email.configured ? "yes" : "no",
    "Demo mode": process.env.DEMO_MODE === "true" ? "on" : "off",
  };
  return <SettingsTabs settings={s} appUrlFromEnv={process.env.APP_URL || null} initialTab={tab} report={report} />;
}
