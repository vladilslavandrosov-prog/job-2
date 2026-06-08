import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

function getConnectionString(): string {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ];
  for (const s of candidates) {
    if (s && (s.startsWith("postgresql://") || s.startsWith("postgres://"))) {
      return s;
    }
  }
  throw new Error("No valid DATABASE_URL or POSTGRES_URL found (must start with postgresql:// or postgres://)");
}

const pool = new Pool({ connectionString: getConnectionString() });

export const db = drizzle(pool, { schema });
export { pool };
