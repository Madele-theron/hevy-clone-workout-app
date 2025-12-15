import { exercises } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

const durationExercises = [
    "Plank",
    "Dead Hang",
    "Wall Sit",
    "Push-up Hold",
    "L-Sit",
    "Hollow Body Hold"
];

async function main() {
    const { db } = await import("@/lib/db");
    console.log("⏱️ Updating exercise types to 'duration'...");

    await db.update(exercises)
        .set({ type: "duration" })
        .where(inArray(exercises.name, durationExercises));

    console.log("✅ Update complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Update failed:", err);
    process.exit(1);
});
