"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { getExercises } from "@/app/actions/workout";
import { createRoutine } from "@/app/actions/routines";
import Button from "./Button";

type Exercise = {
    id: number;
    name: string;
};

type RoutineExercise = {
    id: string; // temp id for list
    exerciseId: number;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
};

export default function RoutineBuilder() {
    const router = useRouter();
    const [exercisesData, setExercisesData] = useState<Exercise[]>([]);
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        getExercises().then(setExercisesData);
    }, []);

    const handleAddExercise = (exerciseId: number) => {
        const ex = exercisesData.find((e) => e.id === exerciseId);
        if (!ex) return;

        setSelectedExercises([
            ...selectedExercises,
            {
                id: crypto.randomUUID(),
                exerciseId: ex.id,
                name: ex.name,
                targetSets: 3,
                targetReps: 10,
                targetWeight: 0
            }
        ]);
    };

    const removeExercise = (index: number) => {
        const newEx = [...selectedExercises];
        newEx.splice(index, 1);
        setSelectedExercises(newEx);
    };

    const updateExercise = (index: number, field: 'targetSets' | 'targetReps' | 'targetWeight', value: string) => {
        const newEx = [...selectedExercises];
        // @ts-ignore - dynamic field access
        newEx[index][field] = Number(value) || 0;
        setSelectedExercises(newEx);
    };

    const handleSave = async () => {
        if (!name.trim()) return alert("Please name your routine");
        if (selectedExercises.length === 0) return alert("Add at least one exercise");

        setIsSubmitting(true);
        try {
            await createRoutine({
                name,
                notes,
                exercises: selectedExercises.map((ex, i) => ({
                    exerciseId: ex.exerciseId,
                    order: i + 1,
                    targetSets: ex.targetSets,
                    targetReps: ex.targetReps,
                    targetWeight: ex.targetWeight
                }))
            });
            router.push('/routines');
        } catch (e) {
            console.error(e);
            alert("Failed to create routine");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pb-32 space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-200">New Routine</h1>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Routine Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Pull Day"
                        className="w-full bg-surface p-4 rounded-xl text-white font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Focus on form..."
                        className="w-full bg-surface p-4 rounded-xl text-white h-24 focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-gray-400 font-medium">Exercises</h3>

                {selectedExercises.map((ex, i) => (
                    <div key={ex.id} className="bg-surface p-4 rounded-xl space-y-3 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-400">{i + 1}. {ex.name}</span>
                            <button onClick={() => removeExercise(i)} className="text-red-500 p-2">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Target Sets</label>
                                <input
                                    type="number"
                                    value={ex.targetSets}
                                    onChange={(e) => updateExercise(i, 'targetSets', e.target.value)}
                                    className="w-full bg-gray-800 p-3 rounded-lg text-center font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Target Reps</label>
                                <input
                                    type="number"
                                    value={ex.targetReps}
                                    onChange={(e) => updateExercise(i, 'targetReps', e.target.value)}
                                    className="w-full bg-gray-800 p-3 rounded-lg text-center font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Target Kg</label>
                                <input
                                    type="number"
                                    value={ex.targetWeight}
                                    onChange={(e) => updateExercise(i, 'targetWeight', e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-gray-800 p-3 rounded-lg text-center font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {exercisesData.map(ex => (
                        <button
                            key={ex.id}
                            onClick={() => handleAddExercise(ex.id)}
                            className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg whitespace-nowrap text-sm font-medium transition-colors border border-gray-700"
                        >
                            + {ex.name}
                        </button>
                    ))}
                </div>
            </div>

            <Button onClick={handleSave} disabled={isSubmitting} className="py-4 text-lg font-bold">
                <Save size={20} className="mr-2" /> Save Routine
            </Button>
        </div>
    );
}
