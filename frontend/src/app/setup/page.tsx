import { redirect } from "next/navigation";
import { getUser, hasOwner } from "@/lib/auth";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { DemoCard } from "@/components/DemoCard";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await hasOwner()) redirect((await getUser()) ? "/admin" : "/login");
  const s = await getSettings();
  return <SetupWizard codeRequired={!!process.env.SETUP_CODE?.trim()} initialAccent={s.accentColor} extra={<DemoCard />} />;
}
