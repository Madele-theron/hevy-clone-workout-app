import { exercises } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables from .env.local or .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const exerciseList = [
    "Australian Pull-ups",
    "Bicep Curls",
    "Bicycle Crunches",
    "Bulgarian Split Squats",
    "Curtsy Lunges",
    "Dead Bugs",
    "Dead Hang",
    "Dumbbell Rows",
    "Goblet Squats",
    "Lateral Band Walks",
    "Negative Pull-ups",
    "Plank",
    "Push-up Hold",
    "Push-ups",
    "Reverse Lunges",
    "Romanian Deadlift (RDL)",
    "Scapula Pulls",
    "Single-leg Dumbbell Hip Thrust",
    "Single-leg Glute Bridges",
    "Squats",
    "Step-ups",
    "Walking Lunges",
    "Wall Sit",
];

async function main() {
    const { db } = await import("@/lib/db");
    console.log("🌱 Seeding exercises...");

    for (const name of exerciseList) {
        // Check if exercise already exists
        const existing = await db
            .select()
            .from(exercises)
            .where(eq(exercises.name, name));

        if (existing.length === 0) {
            await db.insert(exercises).values({
                name,
                type: "strength", // Default type
            });
            console.log(`+ Added: ${name}`);
        } else {
            console.log(`= Skipped (exists): ${name}`);
        }
    }

    console.log("✅ Seeding complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
