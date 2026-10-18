import { redirect } from "next/navigation";
import { owner } from "@/lib/admin/auth";
import { AuthPage } from "@/components/admin/AuthPage";
export const dynamic = "force-dynamic";
export default async function Login() {
  if (await owner()) redirect("/admin");
  return <AuthPage />;
}
