import { getExercises } from "@/app/actions/workout";
import ExerciseLibraryManager from "@/components/ExerciseLibraryManager";

export const metadata = {
    title: "Exercises | Gemini",
};

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
    const exercises = await getExercises();

    // Sort alphabetically
    const sortedExercises = exercises.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="h-full">
            <h1 className="text-xl font-bold text-gray-200 mb-4">Exercise Library</h1>
            <ExerciseLibraryManager initialExercises={sortedExercises} />
        </div>
    );
}
