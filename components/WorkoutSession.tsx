"use client";

import { useEffect, useState, useRef } from "react";
import { getExercises, startNewWorkout, logSet, finishWorkout, getSessionDetails, getPreviousExerciseStats, updateSet } from "@/app/actions/workout";
import RestTimer from "./RestTimer";
import Button from "./Button";
import { Plus, Check, Play, Square, Timer, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Types
type Exercise = {
    id: number;
    name: string;
    type: string;
};

type WorkoutSet = {
    setNumber: number;
    weight: string;
    reps: string;
    isCompleted: boolean;
    note?: string;
};

type ActiveExercise = {
    id: string; // unique ID for client list key
    exerciseId: number;
    name: string;
    sets: WorkoutSet[];
    previousStats?: { weight: number | null; reps: number | null };
};

interface WorkoutSessionProps {
    initialSessionId?: number;
}

export default function WorkoutSession({ initialSessionId }: WorkoutSessionProps) {
    const router = useRouter();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(initialSessionId || null);
    const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [noteModal, setNoteModal] = useState<{ exerciseIndex: number; setIndex: number; note: string } | null>(null);

    // Timer State
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const startTimeRef = useRef<number | null>(null);

    // Load exercises list
    useEffect(() => {
        getExercises().then(setExercises).finally(() => setLoading(false));
    }, []);

    // Load session details if sessionId exists (resuming or started from routine)
    useEffect(() => {
        if (!sessionId) {
            setElapsedSeconds(0);
            return;
        }

        const fetchSession = async () => {
            try {
                const sessionData = await getSessionDetails(sessionId);
                if (sessionData) {
                    // Set up timer based on server start time
                    const serverStart = new Date(sessionData.startTime).getTime();
                    startTimeRef.current = serverStart;
                    const now = Date.now();
                    setElapsedSeconds(Math.floor((now - serverStart) / 1000));

                    if (sessionData.sets.length > 0) {
                        // Group sets by exercise to reconstruct ActiveExercise structure
                        const grouped = new Map<number, ActiveExercise>();

                        // Async fetch previous stats for all exercises
                        const exerciseIds = Array.from(new Set(sessionData.sets.map(s => s.exerciseId)));
                        const prevStatsMap = new Map();

                        await Promise.all(exerciseIds.map(async (id) => {
                            const stats = await getPreviousExerciseStats(id);
                            if (stats) prevStatsMap.set(id, stats);
                        }));

                        sessionData.sets.forEach(set => {
                            if (!grouped.has(set.exerciseId)) {
                                grouped.set(set.exerciseId, {
                                    id: crypto.randomUUID(),
                                    exerciseId: set.exerciseId,
                                    name: set.exercise.name,
                                    sets: [],
                                    previousStats: prevStatsMap.get(set.exerciseId)
                                });
                            }
                            grouped.get(set.exerciseId)!.sets.push({
                                setNumber: set.setNumber,
                                weight: set.weightKg ? set.weightKg.toString() : "",
                                reps: set.reps ? set.reps.toString() : "",
                                isCompleted: set.isCompleted,
                                note: set.note || ""
                            });
                        });

                        setActiveExercises(Array.from(grouped.values()));
                    }
                }
            } catch (e) {
                console.error("Failed to load session details", e);
            }
        };

        fetchSession();
    }, [sessionId]);

    // Timer Interval
    useEffect(() => {
        if (!sessionId || !startTimeRef.current) return;

        const interval = setInterval(() => {
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - startTimeRef.current!) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionId]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartWorkout = async () => {
        try {
            const id = await startNewWorkout();
            setSessionId(id);
            // Optimistic timer start
            startTimeRef.current = Date.now();
            setElapsedSeconds(0);
        } catch (error) {
            console.error("Failed to start workout:", error);
        }
    };

    const handleAddExercise = (exerciseId: number) => {
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return;

        const newActiveExercise: ActiveExercise = {
            id: crypto.randomUUID(),
            exerciseId: exercise.id,
            name: exercise.name,
            sets: [
                { setNumber: 1, weight: "", reps: "", isCompleted: false },
            ],
        };

        setActiveExercises([...activeExercises, newActiveExercise]);
    };

    const handleUpdateSet = (
        exerciseIndex: number,
        setIndex: number,
        field: keyof WorkoutSet,
        value: string | boolean
    ) => {
        const updatedExercises = [...activeExercises];
        // @ts-ignore - dynamic key assignment
        updatedExercises[exerciseIndex].sets[setIndex][field] = value;
        setActiveExercises(updatedExercises);
    };

    const saveNote = async () => {
        if (!noteModal || !sessionId) return;
        const { exerciseIndex, setIndex, note } = noteModal;

        // Update local state
        handleUpdateSet(exerciseIndex, setIndex, "note", note);

        try {
            const exercise = activeExercises[exerciseIndex];
            const set = exercise.sets[setIndex];

            // If set is completed, attempt update in DB
            if (set.isCompleted) {
                await updateSet(sessionId, exercise.exerciseId, set.setNumber, {
                    isCompleted: true,
                    note: note
                });
            }
        } catch (e) {
            console.error("Failed to save note to DB", e);
        }

        setNoteModal(null);
    };

    const handleCompleteSet = async (exerciseIndex: number, setIndex: number) => {
        if (!sessionId) return;

        const exercise = activeExercises[exerciseIndex];
        const set = exercise.sets[setIndex];

        // Toggle completion
        const isCompleted = !set.isCompleted;
        handleUpdateSet(exerciseIndex, setIndex, "isCompleted", isCompleted);

        if (isCompleted) {
            // Open timer strictly if completing
            setIsTimerOpen(true);

            // Log to server
            try {
                await logSet(sessionId, exercise.exerciseId, {
                    reps: Number(set.reps) || 0,
                    weightKg: Number(set.weight) || 0,
                    isCompleted: true,
                    note: set.note // Include note in logSet
                });
            } catch (error) {
                console.error("Failed to log set:", error);
                // Build resilience: maybe untoggle if failed? keeping simple for now
            }
        }
    };

    const addSet = (exerciseIndex: number) => {
        const newExercises = [...activeExercises];
        const exercise = newExercises[exerciseIndex];

        let initialWeight = "";
        let initialReps = "";

        // Auto-fill Logic
        if (exercise.sets.length > 0) {
            // Use last set values
            const lastSet = exercise.sets[exercise.sets.length - 1];
            initialWeight = lastSet.weight;
            initialReps = lastSet.reps;
        } else if (exercise.previousStats) {
            // Use previous history
            initialWeight = exercise.previousStats.weight ? exercise.previousStats.weight.toString() : "";
            initialReps = exercise.previousStats.reps ? exercise.previousStats.reps.toString() : "";
        }

        newExercises[exerciseIndex].sets.push({
            setNumber: exercise.sets.length + 1,
            weight: initialWeight,
            reps: initialReps,
            isCompleted: false
        });
        setActiveExercises(newExercises);
    };

    const handleFinishWorkout = async () => {
        if (!sessionId) return;
        try {
            await finishWorkout(sessionId, elapsedSeconds);
            setSessionId(null);
            setActiveExercises([]);
            setElapsedSeconds(0);
            startTimeRef.current = null;
            router.push("/history"); // Redirect to history
        } catch (error) {
            console.error("Failed to finish workout", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading exercises...</div>;

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Ready to train?</h1>
                    <p className="text-gray-400">Start a blank workout or select a routine.</p>
                </div>
                <Button onClick={handleStartWorkout} className="py-4 text-lg min-h-[56px] min-w-[200px]">
                    <Play size={24} className="mr-2" /> Start Empty Workout
                </Button>
            </div>
        );
    }

    return (
        <div className="pb-32 space-y-6">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-background z-40 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-gray-100">{formatDuration(elapsedSeconds)}</span>
                </div>
                <button
                    onClick={handleFinishWorkout}
                    className="bg-primary/20 text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-primary/30 min-h-[44px]"
                >
                    Finish
                </button>
            </div>

            {activeExercises.map((activeEx, exIndex) => (
                <div key={activeEx.id} className="bg-surface rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-blue-400">{activeEx.name}</h3>
                        {/* Options menu could go here */}
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase text-center mb-2">
                        <div className="col-span-1">Set</div>
                        <div className="col-span-3">Prev</div>
                        <div className="col-span-3">kg</div>
                        <div className="col-span-3">Reps</div>
                        <div className="col-span-2">Check</div>
                    </div>

                    <div className="space-y-2">
                        {activeEx.sets.map((set, setIndex) => (
                            <div
                                key={setIndex}
                                className={`grid grid-cols-12 gap-2 items-center ${set.isCompleted ? "opacity-50" : ""
                                    }`}
                            >
                                <div className="col-span-1 text-center font-bold text-gray-400 bg-gray-800/50 rounded h-11 flex items-center justify-center">
                                    {set.setNumber}
                                </div>
                                <div className="col-span-3 text-center text-xs font-medium text-gray-500 flex items-center justify-center h-11 bg-gray-800/20 rounded border border-gray-800/50">
                                    {activeEx.previousStats?.weight ? `${activeEx.previousStats.weight}kg x ${activeEx.previousStats.reps}` : "-"}
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={set.weight}
                                        onChange={(e) =>
                                            handleUpdateSet(exIndex, setIndex, "weight", e.target.value)
                                        }
                                        className="w-full h-11 min-h-[44px] bg-gray-800 rounded text-center text-lg font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={set.reps}
                                        onChange={(e) =>
                                            handleUpdateSet(exIndex, setIndex, "reps", e.target.value)
                                        }
                                        className="w-full h-11 min-h-[44px] bg-gray-800 rounded text-center text-lg font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="col-span-2 flex gap-1 justify-end">
                                    <button
                                        onClick={() => setNoteModal({ exerciseIndex: exIndex, setIndex, note: set.note || "" })}
                                        className={`w-8 h-11 rounded-lg flex items-center justify-center transition-colors ${set.note ? "text-blue-400" : "text-gray-600 hover:text-gray-400"}`}
                                    >
                                        <MessageSquare size={16} fill={set.note ? "currentColor" : "none"} />
                                    </button>
                                    <button
                                        onClick={() => handleCompleteSet(exIndex, setIndex)}
                                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${set.isCompleted
                                            ? "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                                            }`}
                                    >
                                        {set.isCompleted ? <Check size={24} /> : <Square size={20} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => addSet(exIndex)}
                        className="text-sm py-2 mt-2 min-h-[44px]"
                    >
                        <Plus size={16} className="mr-2" /> Add Set
                    </Button>
                </div>
            ))}

            <div className="pt-4 pb-8">
                <h3 className="text-gray-400 mb-2 font-medium">Add Exercise</h3>
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {exercises.map((ex) => (
                        <button
                            key={ex.id}
                            onClick={() => handleAddExercise(ex.id)}
                            className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg whitespace-nowrap text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600 min-h-[44px]"
                        >
                            {ex.name}
                        </button>
                    ))}
                    <button className="flex-shrink-0 border-2 border-dashed border-gray-700 text-gray-500 px-6 py-3 rounded-lg text-sm font-medium min-h-[44px]">
                        + Create New
                    </button>
                </div>
            </div>

            <RestTimer isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />

            {noteModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-gray-700 rounded-xl p-4 w-full max-w-sm space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white">Add Note</h3>
                            <button onClick={() => setNoteModal(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <textarea
                            className="w-full bg-gray-900 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px] text-white placeholder:text-gray-500"
                            placeholder="RPE, feelings, weight info..."
                            value={noteModal.note}
                            onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                            autoFocus
                        />
                        <Button onClick={saveNote} className="w-full">Save Note</Button>
                    </div>
                </div>
            )}
        </div >
    );
}
