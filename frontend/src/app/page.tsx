import { redirect } from "next/navigation";
import { getUser, hasOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await hasOwner())) redirect("/setup");
  redirect((await getUser()) ? "/admin" : "/login");
}
