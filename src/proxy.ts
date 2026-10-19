import { customerAuth } from "@/lib/customer-auth/server";
export default customerAuth.middleware({ loginUrl: "/login" });
export const config = { matcher: ["/account/:path*"] };
