import { redirect } from "next/navigation";
import { getUser, hasOwner } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AuthForm } from "@/components/AuthForm";
import { AuthLayout } from "@/components/AuthLayout";
import { DemoCard } from "@/components/DemoCard";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasOwner())) redirect("/setup");
  if (await getUser()) redirect("/admin");
  const s = await getSettings();
  return (
    <AuthLayout eyebrow={s.studioName} title="Welcome back." subtitle="Sign in to manage clients and galleries." extra={<DemoCard />}>
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
