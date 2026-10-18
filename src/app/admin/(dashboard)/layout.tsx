import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { Shell } from "@/components/admin/Shell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwner();
  const sql = adminSql();
  const [settings] =
    await sql`SELECT store_name FROM store_settings WHERE id=1`;
  return (
    <Shell email={user.email} storeName={settings.store_name}>
      {children}
    </Shell>
  );
}
