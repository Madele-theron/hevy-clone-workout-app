import { getRoutines } from "@/app/actions/routines";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

export const metadata = {
    title: "Routines | Gemini",
};

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
    const routines = await getRoutines();

    return (
        <div className="pb-24 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-200">Routines</h1>
                <Link
                    href="/routines/new"
                    className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/30 flex items-center"
                >
                    <Plus size={16} className="mr-1" /> New
                </Link>
            </div>

            <div className="space-y-4">
                {routines.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p>No routines yet. Create one to get started!</p>
                    </div>
                ) : (
                    routines.map(routine => (
                        <div key={routine.id} className="bg-surface p-4 rounded-xl border border-transparent hover:border-gray-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white text-lg">{routine.name}</h3>
                                {/* More options (edit/delete) could go here */}
                            </div>
                            {routine.notes && <p className="text-gray-400 text-sm mb-3">{routine.notes}</p>}

                            <div className="space-y-1 mb-3">
                                {routine.routineExercises.map((re, i) => (
                                    <div key={i} className="text-xs text-gray-400 flex justify-between">
                                        <span>{re.exercise.name}</span>
                                        <span className="text-gray-600">{re.targetSets} x {re.targetReps}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-gray-800">
                                <Link href={`/workout?routineId=${routine.id}`} className="text-primary text-sm font-bold flex items-center justify-center py-2 hover:bg-primary/10 rounded-lg transition-colors">
                                    Start Workout <ChevronRight size={16} className="ml-1" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
