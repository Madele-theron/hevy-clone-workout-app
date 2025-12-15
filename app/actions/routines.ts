"use server";

import { db } from "@/lib/db";
import { routines, routineExercises, exercises } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoutineData = {
    name: string;
    notes?: string;
    exercises: {
        exerciseId: number;
        order: number;
        targetSets: number;
        targetReps: number;
        targetWeight?: number;
    }[];
};

export async function createRoutine(data: RoutineData) {
    // 1. Create Routine
    const [newRoutine] = await db
        .insert(routines)
        .values({
            name: data.name,
            notes: data.notes,
        })
        .returning({ id: routines.id });

    // 2. Add Exercises
    if (data.exercises.length > 0) {
        const routineExercisesData = data.exercises.map((ex) => ({
            routineId: newRoutine.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
        }));
        await db.insert(routineExercises).values(routineExercisesData);
    }

    revalidatePath("/routines");
    revalidatePath("/workout");
    return newRoutine.id;
}

export async function getRoutines() {
    const allRoutines = await db.query.routines.findMany({
        orderBy: [desc(routines.createdAt)],
        with: {
            routineExercises: {
                with: {
                    exercise: true
                },
                orderBy: (routineExercises, { asc }) => [asc(routineExercises.order)],
            },
        },
    });
    return allRoutines;
}

export async function deleteRoutine(id: number) {
    await db.delete(routines).where(eq(routines.id, id));
    revalidatePath("/routines");
    revalidatePath("/workout");
}
