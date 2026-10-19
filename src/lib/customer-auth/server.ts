import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { cookies } from "next/headers";
import { cache } from "react";

export const customerAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET!, sessionDataTtl: 60 },
});

export const customer = cache(async () => {
  const jar = await cookies();
  if (!jar.getAll().some(({ name }) => name.includes("neon-auth"))) return null;
  const { data, error } = await customerAuth.getSession();
  if (error)
    throw new Error("Your session could not be checked. Please try again.");
  return data?.user ?? null;
});
