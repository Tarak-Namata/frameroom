import { getSettings, publicSettings } from "@/lib/db";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = publicSettings(await getSettings());
  const { tab } = await searchParams;
  return <SettingsTabs settings={s} appUrlFromEnv={process.env.APP_URL || null} initialTab={tab} />;
}
