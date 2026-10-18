import { CustomerProfile } from "@/components/admin/CustomerProfile";

export default async function CustomerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return <CustomerProfile email={email} />;
}
