import { migrate } from "drizzle-orm/neon-http/migrator";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env.local");
}

async function runMigrations() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        // Initialize the database connection using Drizzle ORM with Neon
        const db = drizzle(sql, { schema: {} }); // Assuming you have a schema defined

        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("All migrations are completed successfully.");
    } catch (error) {
        console.error("Error running migrations:", error);
        process.exit(1); // Exit with failure code
    }
}

runMigrations()