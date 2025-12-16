"use server";

import { db } from "@/lib/db";
import { exercises, sets, workoutSessions, routines, routineExercises } from "@/drizzle/schema";
import { eq, asc, desc, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth"; // Updated Import

export async function getExercises() {
    return await db.select().from(exercises);
}

// NEW: Get Previous Stats
export async function getPreviousExerciseStats(exerciseId: number) {
    // Find the last completed set for this exercise
    // We want the most recent *session* first, then the best set? 
    // Usually "Previous" means what I did last time.
    // Let's filter for isCompleted = true
    const userId = await getUserId();
    if (!userId) return null;

    const lastSet = await db.query.sets.findFirst({
        where: and(
            eq(sets.exerciseId, exerciseId),
            eq(sets.isCompleted, true),
            eq(sets.userId, userId)
        ),
        orderBy: [desc(sets.createdAt)], // Most recent by creation
        // Ideally we order by Session Date, but Sets created_at is usually fine proxy
    });

    if (!lastSet) return null;

    return {
        weight: lastSet.weightKg,
        reps: lastSet.reps
    };
}

export async function startNewWorkout(routineId?: number, routineName?: string) {
    try {
        const userId = await getUserId();
        if (!userId) throw new Error("Unauthorized");

        // 1. Create Session with routine name if starting from routine
        const [session] = await db
            .insert(workoutSessions)
            .values({
                userId,
                name: routineName || null, // Store the routine name
                startTime: new Date(),
                notes: routineId ? "Started from Routine" : undefined,
            })
            .returning({ id: workoutSessions.id });

        // 2. If Routine provided, copy exercises and targets
        if (routineId) {
            const routine = await db.query.routines.findFirst({
                where: and(
                    eq(routines.id, routineId),
                    eq(routines.userId, userId)
                ),
                with: {
                    routineExercises: {
                        orderBy: (re, { asc }) => [asc(re.order)]
                    }
                }
            });

            if (routine && routine.routineExercises.length > 0) {
                // For each routine exercise, add 'targetSets' number of empty sets
                const setsToInsert = [];

                for (const re of routine.routineExercises) {
                    for (let i = 1; i <= re.targetSets; i++) {
                        setsToInsert.push({
                            userId,
                            sessionId: session.id,
                            exerciseId: re.exerciseId,
                            setNumber: i,
                            reps: re.targetReps,
                            weightKg: re.targetWeight || 0, // New: Copy target weight, default to 0
                            isCompleted: false
                        });
                    }
                }

                if (setsToInsert.length > 0) {
                    await db.insert(sets).values(setsToInsert);
                }
            }
        }

        revalidatePath('/workout');
        return session.id;
    } catch (error) {
        console.error("Failed to start new workout:", error);
        throw error;
    }
}

export type SetData = {
    setNumber: number; // Ensure setNumber is here
    reps?: number | string;
    weightKg?: number | string;
    isCompleted: boolean;
    note?: string;
};

// Helper function to parse reps (handles duration format like "1:30" and strings like "10s")
function parseReps(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;

    const str = value.toString().trim();
    if (str === '') return 0;

    // Handle duration format "M:SS" or "MM:SS"
    if (str.includes(':')) {
        const parts = str.split(':');
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
    }

    // Remove any non-numeric characters except decimal point
    return parseInt(str.replace(/[^0-9.-]/g, '')) || 0;
}

function parseWeight(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
}

export async function logSet(sessionId: number, exerciseId: number, data: SetData) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const reps = parseReps(data.reps);
    const weightKg = parseWeight(data.weightKg);

    // Use upsert to prevent duplicate entries on rapid toggling
    await db.insert(sets).values({
        userId,
        sessionId,
        exerciseId,
        setNumber: data.setNumber || 0,
        weightKg,
        reps,
        isCompleted: true,
        note: data.note || null,
    }).onConflictDoUpdate({
        target: [sets.sessionId, sets.exerciseId, sets.setNumber],
        set: {
            reps,
            weightKg,
            isCompleted: true,
            note: data.note || null
        }
    });

    revalidatePath('/workout');
}

export async function updateSet(sessionId: number, exerciseId: number, setNumber: number, data: Partial<SetData>) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    // Build a type-safe update payload - only include validated fields
    const updatePayload: {
        reps?: number;
        weightKg?: number;
        isCompleted?: boolean;
        note?: string | null;
    } = {};

    if (data.reps !== undefined) {
        updatePayload.reps = parseReps(data.reps);
    }

    if (data.weightKg !== undefined) {
        updatePayload.weightKg = parseWeight(data.weightKg);
    }

    if (data.isCompleted !== undefined) {
        updatePayload.isCompleted = data.isCompleted;
    }

    if (data.note !== undefined) {
        updatePayload.note = data.note || null;
    }

    // Only update if we have valid fields
    if (Object.keys(updatePayload).length === 0) return;

    await db.update(sets)
        .set(updatePayload)
        .where(and(
            eq(sets.userId, userId),
            eq(sets.sessionId, sessionId),
            eq(sets.exerciseId, exerciseId),
            eq(sets.setNumber, setNumber)
        ));

    revalidatePath('/workout');
}


export async function finishWorkout(sessionId: number, clientDuration?: number) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();

    // Fetch start time to calculate duration fallback
    const [session] = await db
        .select({ startTime: workoutSessions.startTime })
        .from(workoutSessions)
        .where(and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId)
        ));

    if (!session) throw new Error("Session not found");

    const duration = clientDuration || Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    await db
        .update(workoutSessions)
        .set({
            endTime: now,
            duration,
        })
        .where(and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId)
        ));

    revalidatePath('/history');
    revalidatePath('/workout');
}

export type WorkoutHistoryItem = {
    id: number;
    name: string | null; // Routine name like "Pull Day"
    date: Date;
    duration: number | null;
    volume: number;
    notes: string | null;
    exercises: {
        name: string;
        sets: {
            setNumber: number;
            weight: number;
            reps: number;
            isCompleted: boolean;
        }[];
    }[];
};

export async function getWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
    const userId = await getUserId();
    if (!userId) return []; // or empty array

    const sessions = await db.query.workoutSessions.findMany({
        orderBy: [desc(workoutSessions.startTime)],
        where: and(
            ne(workoutSessions.duration, 0), // Only finished workouts? Or filter by endTime?
            // Actually, we should probably filter out empty sessions or "in progress" ones if desired.
            // For now, let's just get everything.
            eq(workoutSessions.userId, userId)
        ),
        with: {
            sets: {
                with: {
                    exercise: true
                },
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
            },
        },
    });

    return sessions.map((session) => {
        // Group sets by exercise
        const exerciseMap = new Map<number, { name: string; sets: any[] }>();

        session.sets.forEach((set) => {
            if (!exerciseMap.has(set.exerciseId)) {
                exerciseMap.set(set.exerciseId, {
                    name: set.exercise.name,
                    sets: [],
                });
            }
            exerciseMap.get(set.exerciseId)!.sets.push({
                setNumber: set.setNumber,
                weight: set.weightKg || 0,
                reps: set.reps || 0,
                isCompleted: set.isCompleted,
            });
        });

        const totalVolume = session.sets.reduce(
            (acc, s) => acc + (s.weightKg || 0) * (s.reps || 0),
            0
        );

        return {
            id: session.id,
            name: session.name || null, // Include workout/routine name
            date: session.startTime,
            duration: session.duration,
            volume: totalVolume,
            notes: session.notes,
            exercises: Array.from(exerciseMap.values()),
        };
    });
}

// Need session details for resume functionality
export async function getSessionDetails(sessionId: number) {
    const userId = await getUserId();
    if (!userId) return null;

    const session = await db.query.workoutSessions.findFirst({
        where: and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId)
        ),
        with: {
            sets: {
                with: {
                    exercise: true
                },
                orderBy: (sets, { asc }) => [asc(sets.setNumber)]
            }
        }
    });
    return session;
}

// NEW: Exercise Management Actions
export async function createExercise(data: { name: string; type?: string; notes?: string }): Promise<typeof exercises.$inferSelect> {
    const [newEx] = await db.insert(exercises).values({
        name: data.name,
        type: data.type || "strength",
        notes: data.notes,
    }).returning();

    revalidatePath('/exercises');
    return newEx;
}

export async function updateExercise(id: number, data: { name: string; notes?: string }) {
    await db.update(exercises)
        .set({
            name: data.name,
            notes: data.notes,
        })
        .where(eq(exercises.id, id));

    revalidatePath('/exercises');
}

export async function deleteExercise(id: number) {
    try {
        await db.delete(exercises).where(eq(exercises.id, id));
        revalidatePath('/exercises');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete exercise:", error);
        return { success: false, error: "Failed to delete. Exercise might be in use." };
    }
}
export async function deleteSet(sessionId: number, exerciseId: number, setNumber: number) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(sets)
        .where(and(
            eq(sets.userId, userId),
            eq(sets.sessionId, sessionId),
            eq(sets.exerciseId, exerciseId),
            eq(sets.setNumber, setNumber)
        ));

    revalidatePath('/workout');
}

export async function deleteWorkout(sessionId: number) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    // Use transaction to ensure atomic deletion - prevents orphaned data
    await db.transaction(async (tx) => {
        // Delete sets first (child records)
        await tx.delete(sets).where(and(
            eq(sets.sessionId, sessionId),
            eq(sets.userId, userId)
        ));

        // Delete session (parent record)
        await tx.delete(workoutSessions).where(and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId)
        ));
    });

    revalidatePath('/history');
    revalidatePath('/workout');
}

export async function repeatWorkout(sessionId: number) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    // Get the original session details
    const originalSession = await getSessionDetails(sessionId);
    if (!originalSession) throw new Error("Session not found");

    // Create a new workout session
    const [newSession] = await db
        .insert(workoutSessions)
        .values({
            userId,
            startTime: new Date(),
            notes: "Repeated from previous workout",
        })
        .returning({ id: workoutSessions.id });

    // Copy all exercises and sets structure
    const setsToInsert = [];
    for (const set of originalSession.sets) {
        setsToInsert.push({
            userId,
            sessionId: newSession.id,
            exerciseId: set.exerciseId,
            setNumber: set.setNumber,
            reps: set.reps || 0,  // Copy original reps as target
            weightKg: set.weightKg || 0,
            isCompleted: false,
        });
    }

    if (setsToInsert.length > 0) {
        await db.insert(sets).values(setsToInsert);
    }

    revalidatePath('/workout');
    return newSession.id;
}

export async function saveSessionAsRoutine(sessionId: number, routineName: string) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    if (!routineName.trim()) throw new Error("Routine name required");

    const session = await getSessionDetails(sessionId);
    if (!session) throw new Error("Session not found");

    const [newRoutine] = await db
        .insert(routines)
        .values({
            userId,
            name: routineName,
            notes: `Created from workout on ${new Date(session.startTime).toLocaleDateString()}`,
        })
        .returning({ id: routines.id });

    const exerciseMap = new Map<number, { exerciseId: number; sets: typeof session.sets }>();

    session.sets.forEach(set => {
        if (!exerciseMap.has(set.exerciseId)) {
            exerciseMap.set(set.exerciseId, { exerciseId: set.exerciseId, sets: [] });
        }
        exerciseMap.get(set.exerciseId)!.sets.push(set);
    });

    let order = 0;
    for (const [exerciseId, data] of exerciseMap) {
        const avgReps = Math.round(
            data.sets.reduce((sum, s) => sum + (s.reps || 0), 0) / data.sets.length
        );
        const avgWeight = Math.round(
            (data.sets.reduce((sum, s) => sum + (s.weightKg || 0), 0) / data.sets.length) * 100
        ) / 100; // Round to 2 decimal places

        await db.insert(routineExercises).values({
            userId,
            routineId: newRoutine.id,
            exerciseId: data.exerciseId,
            order: order++,
            targetSets: data.sets.length,
            targetReps: avgReps,
            targetWeight: avgWeight,
        });
    }

    revalidatePath('/routines');
    return newRoutine.id;
}
