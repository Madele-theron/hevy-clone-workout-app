"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Trash2, Pencil } from "lucide-react";
import { deleteRoutine } from "@/app/actions/routines";

type Routine = {
    id: number;
    name: string;
    notes: string | null;
    routineExercises: {
        exercise: { name: string };
        targetSets: number;
        targetReps: number | string;
    }[];
};

export default function RoutineList({ initialRoutines }: { initialRoutines: Routine[] }) {
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleStart = () => {
        setIsStarting(true);
    };

    const handleDelete = async (routineId: number, routineName: string) => {
        if (!window.confirm(`Delete "${routineName}"? This cannot be undone.`)) return;

        setDeletingId(routineId);
        try {
            await deleteRoutine(routineId);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete routine:", error);
            alert("Failed to delete routine. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            {isStarting && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={48} className="text-primary animate-spin" />
                </div>
            )}

            <div className="space-y-4">
                {initialRoutines.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p>No routines yet. Create one to get started!</p>
                    </div>
                ) : (
                    initialRoutines.map(routine => (
                        <div key={routine.id} className="bg-surface p-4 rounded-xl border border-transparent hover:border-gray-700 transition-colors group relative">
                            {/* Edit & Delete Icons */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                <Link
                                    href={`/routines/${routine.id}/edit`}
                                    className="p-2 text-gray-500 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-800"
                                    title="Edit Routine"
                                >
                                    <Pencil size={18} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(routine.id, routine.name)}
                                    disabled={deletingId === routine.id}
                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                    title="Delete Routine"
                                >
                                    {deletingId === routine.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-2 pr-20">
                                <h3 className="font-bold text-white text-lg">{routine.name}</h3>
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
                                <Link
                                    href={`/workout?routineId=${routine.id}&routineName=${encodeURIComponent(routine.name)}`}
                                    onClick={handleStart}
                                    className="text-primary text-sm font-bold flex items-center justify-center py-2 hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                    Start Workout <ChevronRight size={16} className="ml-1" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
