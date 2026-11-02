import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { db, getSettings } from "@/lib/db";
import { accentVars } from "@/lib/accent";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const s = await getSettings();
  const unread = await db.selection.count({ where: { status: "submitted", seenAt: null } });
  return (
    <div className="accent-scope min-h-screen lg:grid lg:grid-cols-[240px_1fr]" style={accentVars(s.accentColor)}>
      <AdminNav studioName={s.studioName} userName={user.name} unread={unread} />
      <main className="min-w-0 px-5 py-8 sm:px-10 lg:px-16 lg:py-14">{children}</main>
    </div>
  );
}
