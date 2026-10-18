import "server-only";
import { neon } from "@neondatabase/serverless";
export const adminSql = () => neon(process.env.DATABASE_URL!);
export type Row = Record<string, unknown>;
