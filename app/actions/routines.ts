"use server";

import { db } from "@/lib/db";
import { routines, routineExercises, exercises } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth";

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
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    // 1. Create Routine
    const [newRoutine] = await db
        .insert(routines)
        .values({
            userId,
            name: data.name,
            notes: data.notes,
        })
        .returning({ id: routines.id });

    // 2. Add Exercises
    if (data.exercises.length > 0) {
        const routineExercisesData = data.exercises.map((ex) => ({
            userId,
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
    const userId = await getUserId();
    if (!userId) return [];

    const allRoutines = await db.query.routines.findMany({
        where: eq(routines.userId, userId),
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
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(routines).where(
        and(
            eq(routines.id, id),
            eq(routines.userId, userId)
        )
    );
    revalidatePath("/routines");
    revalidatePath("/workout");
}

export async function getRoutineById(id: number) {
    const userId = await getUserId();
    if (!userId) return null;

    const routine = await db.query.routines.findFirst({
        where: and(
            eq(routines.id, id),
            eq(routines.userId, userId)
        ),
        with: {
            routineExercises: {
                with: {
                    exercise: true
                },
                orderBy: (routineExercises, { asc }) => [asc(routineExercises.order)],
            },
        },
    });
    return routine;
}

export async function updateRoutine(id: number, data: RoutineData) {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    // 1. Update routine name and notes
    await db.update(routines)
        .set({
            name: data.name,
            notes: data.notes,
        })
        .where(and(
            eq(routines.id, id),
            eq(routines.userId, userId)
        ));

    // 2. Delete old exercises (cascade handles this, but we do it explicitly)
    await db.delete(routineExercises).where(
        eq(routineExercises.routineId, id)
    );

    // 3. Insert new exercises
    if (data.exercises.length > 0) {
        const routineExercisesData = data.exercises.map((ex) => ({
            userId,
            routineId: id,
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
}
