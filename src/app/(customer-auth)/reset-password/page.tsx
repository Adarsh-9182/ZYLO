import { CustomerAuthForm } from "@/components/CustomerAuthForm";
export const metadata = { title: "Choose a new password — Zylo" };
export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return (
    <CustomerAuthForm
      mode="reset"
      resetToken={token}
      initialError={
        error || !token
          ? "This reset link is invalid or expired. Request a new one."
          : undefined
      }
    />
  );
}
