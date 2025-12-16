import { notFound } from "next/navigation";
import { getRoutineById } from "@/app/actions/routines";
import RoutineBuilder from "@/components/RoutineBuilder";

export const metadata = {
    title: "Edit Routine | IronPath",
};

export const dynamic = 'force-dynamic';

type Props = {
    params: { id: string };
};

export default async function EditRoutinePage({ params }: Props) {
    const routineId = parseInt(params.id, 10);

    if (isNaN(routineId)) {
        notFound();
    }

    const routine = await getRoutineById(routineId);

    if (!routine) {
        notFound();
    }

    // Transform routine data into the format RoutineBuilder expects
    const initialRoutine = {
        id: routine.id,
        name: routine.name,
        notes: routine.notes || "",
        exercises: routine.routineExercises.map((re) => ({
            id: crypto.randomUUID(),
            exerciseId: re.exerciseId,
            name: re.exercise.name,
            targetSets: re.targetSets,
            targetReps: re.targetReps,
            targetWeight: re.targetWeight || 0,
        })),
    };

    return <RoutineBuilder initialRoutine={initialRoutine} />;
}
