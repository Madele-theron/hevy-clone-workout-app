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

export async function startNewWorkout(routineId?: number) {
    try {
        const userId = await getUserId();
        if (!userId) throw new Error("Unauthorized");

        // 1. Create Session
        const [session] = await db
            .insert(workoutSessions)
            .values({
                userId,
                startTime: new Date(),
                notes: routineId ? "Started from Routine" : undefined, // Could fetch routine name if desired
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
    reps?: number;
    weightKg?: number;
    isCompleted: boolean;
};

export async function logSet(sessionId: number, exerciseId: number, data: SetData) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    await db.insert(sets).values({
        userId,
        sessionId,
        exerciseId,
        setNumber: 0, // Placeholder, logic to determine set number can be added later
        reps: data.reps,
        weightKg: data.weightKg,
        isCompleted: data.isCompleted,
    });

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
export async function createExercise(data: { name: string; notes?: string }) {
    const [newEx] = await db.insert(exercises).values({
        name: data.name,
        type: "strength", // Default
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
