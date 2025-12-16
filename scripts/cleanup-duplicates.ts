import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function cleanupDuplicateSets() {
    console.log("Starting duplicate sets cleanup...");

    try {
        // Find and delete duplicates, keeping the latest entry (highest id) per set
        const result = await db.execute(sql`
            WITH duplicates AS (
                SELECT id,
                       session_id,
                       exercise_id,
                       set_number,
                       ROW_NUMBER() OVER (
                           PARTITION BY session_id, exercise_id, set_number
                           ORDER BY id DESC
                       ) as row_num
                FROM sets
            )
            DELETE FROM sets
            WHERE id IN (
                SELECT id FROM duplicates WHERE row_num > 1
            )
        `);

        console.log("Cleanup complete!", result);

        // Verify no duplicates remain
        const check = await db.execute(sql`
            SELECT session_id, exercise_id, set_number, COUNT(*) as cnt
            FROM sets
            GROUP BY session_id, exercise_id, set_number
            HAVING COUNT(*) > 1
        `);

        if (check.rows && check.rows.length > 0) {
            console.error("WARNING: Duplicates still exist:", check.rows);
        } else {
            console.log("✅ No duplicates remain. Ready for migration!");
        }

    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

cleanupDuplicateSets();
