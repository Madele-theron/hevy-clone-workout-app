"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";

type Routine = {
    id: number;
    name: string;
    notes: string | null;
    routineExercises: {
        exercise: { name: string };
        targetSets: number;
        targetReps: string;
    }[];
};

export default function RoutineList({ initialRoutines }: { initialRoutines: Routine[] }) {
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = () => {
        setIsStarting(true);
        // Navigation automatically happens via Link, so we just show spinner until unmount/nav
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
                        <div key={routine.id} className="bg-surface p-4 rounded-xl border border-transparent hover:border-gray-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
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
                                    href={`/workout?routineId=${routine.id}`}
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
