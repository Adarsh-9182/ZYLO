import { AuthPage } from "@/components/admin/AuthPage";
export default async function Setup({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <AuthPage setup setupToken={token} />;
}
