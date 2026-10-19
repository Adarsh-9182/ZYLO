import { CustomerAuthForm } from "@/components/CustomerAuthForm";
export const metadata = { title: "Reset your password — Zylo" };
export default function ForgotPassword() {
  return <CustomerAuthForm mode="forgot" />;
}
