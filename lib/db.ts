import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";

const connectionString = process.env.POSTGRES_URL!;
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// Fix for local development: strip sslmode=require if present for localhost
const safeConnectionString = isLocal
    ? connectionString.replace("?sslmode=require", "").replace("&sslmode=require", "")
    : connectionString;

const pool = new Pool({
    connectionString: safeConnectionString,
    // Ensure SSL is disabled for local if stripping didn't work effectively or to be explicit
    ssl: isLocal ? false : undefined,
});

export const db = drizzle(pool, { schema });
