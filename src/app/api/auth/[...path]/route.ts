import { customerAuth } from "@/lib/customer-auth/server";
export const { GET, POST } = customerAuth.handler();
