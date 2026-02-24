import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// neon() doesn't connect until a query is executed,
// so this is safe during build even without POSTGRES_URL
const sql = neon(
  process.env.POSTGRES_URL || "postgresql://placeholder:placeholder@localhost/placeholder"
);

export const db = drizzle(sql, { schema });
