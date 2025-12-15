import { routines, routineExercises, exercises } from "@/drizzle/schema";
import { eq, ilike } from "drizzle-orm";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

// Configuration
const SEED_USER_ID = "seed_user_template";

const ROUTINE_DATA = [
    {
        name: "Monday - Strength A (Upper)",
        exercises: [
            { name: "Push-ups", sets: 3, repsStr: "8-10" },
            { name: "Dumbbell Rows", sets: 3, repsStr: "10 each side" },
            { name: "Bicep Curls", sets: 2, repsStr: "12-16 each side" },
            { name: "Dead Bugs", sets: 3, repsStr: "10" },
            { name: "Bicycle Crunches", sets: 2, repsStr: "20" },
            { name: "Plank", sets: 3, repsStr: "30-45 sec" },
        ]
    },
    {
        name: "Tuesday - Pull-Up Training (Bar)",
        exercises: [
            { name: "Scapula Pulls", sets: 2, repsStr: "8" }, // "Scapular Pulls" in request, "Scapula Pulls" in DB check
            { name: "Negative Pull-ups", sets: 2, repsStr: "5 reps (5 sec descent)" },
            { name: "Dead Hang", sets: 2, repsStr: "20-30 sec" },
        ]
    },
    {
        name: "Wednesday - Strength B (Glutes)",
        exercises: [
            { name: "Lateral Band Walks", sets: 2, repsStr: "12 steps/side" },
            { name: "Walking Lunges", sets: 2, repsStr: "20 steps" },
            { name: "Bulgarian Split Squats", sets: 2, repsStr: "10 each leg" },
            { name: "Single-Leg Glute Bridges", sets: 3, repsStr: "12 each leg" },
            { name: "Romanian Deadlift (RDL)", sets: 3, repsStr: "10–12" },
            { name: "Squats", sets: 3, repsStr: "15" },
            { name: "Reverse Lunges", sets: 3, repsStr: "10 each leg" },
            { name: "Wall Sit", sets: 3, repsStr: "30 sec" },
        ]
    },
    {
        name: "Thursday - Pull-Up Training (Rings)",
        exercises: [
            { name: "Scapula Pulls", sets: 2, repsStr: "8" },
            { name: "Negative Pull-ups", sets: 2, repsStr: "5 reps (5 sec descent)" },
            { name: "Australian Pull-ups", sets: 2, repsStr: "2 RIR" },
            { name: "Dead Hang", sets: 2, repsStr: "20-30 sec" },
            { name: "Push-up Hold", sets: 2, repsStr: "20-30 sec" },
        ]
    },
    {
        name: "Friday - Strength C",
        exercises: [
            { name: "Lateral Band Walks", sets: 2, repsStr: "12 steps/side" },
            { name: "Romanian Deadlift (RDL)", sets: 3, repsStr: "10–12" },
            { name: "Squats", sets: 3, repsStr: "12" },
            { name: "Push-ups", sets: 3, repsStr: "8" },
            { name: "Dumbbell Rows", sets: 3, repsStr: "12" },
            { name: "Curtsy Lunges", sets: 3, repsStr: "10 each leg" },
            { name: "Single-leg Dumbbell Hip Thrust", sets: 2, repsStr: "12 each leg" },
            { name: "Step-ups", sets: 2, repsStr: "10 each leg" },
            { name: "Plank", sets: 3, repsStr: "30 sec" },
        ]
    },
    {
        name: "Saturday - Optional Pull-Up",
        exercises: [
            { name: "Scapula Pulls", sets: 1, repsStr: "8" },
            { name: "Negative Pull-ups", sets: 1, repsStr: "3" },
            { name: "Dead Hang", sets: 3, repsStr: "20 sec" },
        ]
    }
];

// Helper to parse integer from rep string
function parseReps(repsStr: string): number {
    const match = repsStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

async function main() {
    const { db } = await import("@/lib/db");
    console.log("🌱 Seeding Starting...");

    // 1. Fetch all exercises for lookup
    const allExercises = await db.select().from(exercises);
    console.log(`Loaded ${allExercises.length} exercises from DB.`);

    for (const routineData of ROUTINE_DATA) {
        console.log(`Processing Routine: ${routineData.name}`);

        // Create Routine
        const [insertedRoutine] = await db.insert(routines).values({
            userId: SEED_USER_ID,
            name: routineData.name,
        }).returning({ id: routines.id });

        console.log(` > Created Routine ID: ${insertedRoutine.id}`);

        // Process Exercises
        let orderCounter = 1;
        for (const exData of routineData.exercises) {
            // Find exercise ID (fuzzy match or exact)
            // The list provided matches the seed list closely, but some might differ slightly.
            // e.g. "Scapular Pulls" vs "Scapula Pulls"
            // We'll normalize string for comparison
            const targetName = exData.name.toLowerCase();

            // Try Exact Match first
            let exercise = allExercises.find(e => e.name.toLowerCase() === targetName);

            // Try "Contains" if not found
            if (!exercise) {
                exercise = allExercises.find(e => e.name.toLowerCase().includes(targetName) || targetName.includes(e.name.toLowerCase()));
            }

            // Fallback for "Scapular" vs "Scapula" specifically if needed
            if (!exercise && targetName.includes("scapular")) {
                exercise = allExercises.find(e => e.name.toLowerCase().includes("scapula"));
            }

            if (exercise) {
                await db.insert(routineExercises).values({
                    userId: SEED_USER_ID,
                    routineId: insertedRoutine.id,
                    exerciseId: exercise.id,
                    order: orderCounter++,
                    targetSets: exData.sets,
                    targetReps: parseReps(exData.repsStr),
                    // We lose the textual part of "repsStr" here unfortunately unless we added a note column to schema
                });
                console.log(`   + Added: ${exercise.name} (${exData.sets} x ${parseReps(exData.repsStr)})`);
            } else {
                console.warn(`   ! WARNING: Exercise not found: ${exData.name}`);
            }
        }
    }

    console.log("✅ Routine Seeding Complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Routine Seeding failed:", err);
    process.exit(1);
});
