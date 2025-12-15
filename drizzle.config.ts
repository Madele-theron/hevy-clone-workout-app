import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.POSTGRES_URL || "";
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// Fix for local development: strip sslmode=require if present for localhost
const safeConnectionString = isLocal
    ? connectionString.replace("?sslmode=require", "").replace("&sslmode=require", "")
    : connectionString;

export default defineConfig({
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: safeConnectionString,
    },
});
