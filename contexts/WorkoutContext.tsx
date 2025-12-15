"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { getExercises, startNewWorkout, logSet, finishWorkout, updateSet, getSessionDetails, getPreviousExerciseStats } from "@/app/actions/workout";
import { useRouter } from "next/navigation";

// Types
export type Exercise = {
    id: number;
    name: string;
    type: string;
};

export type WorkoutSet = {
    setNumber: number;
    weight: string;
    reps: string;
    isCompleted: boolean;
    note?: string;
};

export type ActiveExercise = {
    id: string;
    exerciseId: number;
    name: string;
    sets: WorkoutSet[];
    previousStats?: { weight: number | null; reps: number | null };
};

type WorkoutContextType = {
    sessionId: number | null;
    activeExercises: ActiveExercise[];
    elapsedSeconds: number;
    isTimerOpen: boolean;
    exercises: Exercise[];
    isLoading: boolean;
    startWorkout: () => Promise<void>;
    addExercise: (exerciseId: number) => void;
    addSet: (exerciseIndex: number) => void;
    updateSetLocal: (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string | boolean) => void;
    completeSet: (exerciseIndex: number, setIndex: number) => Promise<void>;
    saveNote: (exerciseIndex: number, setIndex: number, note: string) => Promise<void>;
    finishCurrentWorkout: () => Promise<void>;
    setTimerOpen: (open: boolean) => void;
    resumeWorkout: (id: number) => Promise<void>;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_KEY = 'ironpath_workout_state';

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Timer Ref
    const startTimeRef = useRef<number | null>(null);
    // Debounce Save Ref
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Init: Load Exercises & Hydrate from LocalStorage
    useEffect(() => {
        const init = async () => {
            try {
                // Fetch exercises list first
                const exList = await getExercises();
                setExercises(exList);

                // Check LocalStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Validate basic structure
                    if (parsed.sessionId) {
                        setSessionId(parsed.sessionId);
                        setActiveExercises(parsed.activeExercises || []);
                        // Restore timer start relative to now if it was running? 
                        // Actually, we should rely on server start time if available, or persisted start time.
                        // Let's rely on the persisted start time in LS.
                        if (parsed.startDate) {
                            startTimeRef.current = parsed.startDate;
                            const now = Date.now();
                            setElapsedSeconds(Math.floor((now - parsed.startDate) / 1000));
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to hydrate workout", e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // 2. Timer Loop
    useEffect(() => {
        if (!sessionId || !startTimeRef.current) return;

        const interval = setInterval(() => {
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - startTimeRef.current!) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionId]);

    // 3. Auto-Save to LocalStorage
    useEffect(() => {
        if (isLoading) return;

        if (sessionId) {
            const state = {
                sessionId,
                activeExercises,
                startDate: startTimeRef.current
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [sessionId, activeExercises, isLoading]);


    // -- Actions --

    const startWorkout = async () => {
        try {
            const id = await startNewWorkout();
            setSessionId(id);
            startTimeRef.current = Date.now();
            setElapsedSeconds(0);
            setActiveExercises([]);
        } catch (error) {
            console.error("Failed to start workout:", error);
        }
    };

    const resumeWorkout = async (id: number) => {
        // If we already have this session active in memory/LS, do nothing?
        // Or re-fetch to be safe?
        // If it's a different session than current, switch.
        if (sessionId === id) return;

        try {
            const sessionData = await getSessionDetails(id);
            if (sessionData) {
                setSessionId(id);
                const serverStart = new Date(sessionData.startTime).getTime();
                startTimeRef.current = serverStart;

                // Reconstruct exercises same as we did in WorkoutSession
                // ... (Logic from WorkoutSession.tsx lines 70-100 approx)
                // Need to fetch prev stats too.
                const grouped = new Map<number, ActiveExercise>();
                const exerciseIds = Array.from(new Set(sessionData.sets.map(s => s.exerciseId)));

                // Note: In a real app we might want to optimize this hydration to not block UI too much
                // For now, simple Promise.all
                const prevStatsMap = new Map();
                await Promise.all(exerciseIds.map(async (eid) => {
                    const stats = await getPreviousExerciseStats(eid);
                    if (stats) prevStatsMap.set(eid, stats);
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
        } catch (e) {
            console.error("Failed to resume", e);
        }
    };

    const addExercise = (exerciseId: number) => {
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

        setActiveExercises(prev => [...prev, newActiveExercise]);
    };

    const addSet = (exerciseIndex: number) => {
        const newExercises = [...activeExercises];
        const exercise = newExercises[exerciseIndex];
        let initialWeight = "";
        let initialReps = "";

        if (exercise.sets.length > 0) {
            const lastSet = exercise.sets[exercise.sets.length - 1];
            initialWeight = lastSet.weight;
            initialReps = lastSet.reps;
        } else if (exercise.previousStats) {
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

    const updateSetLocal = (
        exerciseIndex: number,
        setIndex: number,
        field: keyof WorkoutSet,
        value: string | boolean
    ) => {
        const updatedExercises = [...activeExercises];
        // @ts-ignore
        updatedExercises[exerciseIndex].sets[setIndex][field] = value;
        setActiveExercises(updatedExercises);
    };

    const completeSet = async (exerciseIndex: number, setIndex: number) => {
        if (!sessionId) return;
        const exercise = activeExercises[exerciseIndex];
        const set = exercise.sets[setIndex];

        // Optimistic Update
        const isCompleted = !set.isCompleted;
        updateSetLocal(exerciseIndex, setIndex, "isCompleted", isCompleted);

        if (isCompleted) {
            setIsTimerOpen(true);
            try {
                await logSet(sessionId, exercise.exerciseId, {
                    reps: Number(set.reps) || 0,
                    weightKg: Number(set.weight) || 0,
                    isCompleted: true,
                    note: set.note
                });
            } catch (error) {
                console.error("Log set failed", error);
                // Revert? For now keeps simple.
            }
        }
    };

    const saveNote = async (exerciseIndex: number, setIndex: number, note: string) => {
        if (!sessionId) return;
        updateSetLocal(exerciseIndex, setIndex, "note", note);

        const exercise = activeExercises[exerciseIndex];
        const set = exercise.sets[setIndex];

        if (set.isCompleted) {
            try {
                // Here we can use updateSet if we exported it from context or just call it directly.
                // We imported it at top level.
                await updateSet(sessionId, exercise.exerciseId, set.setNumber, {
                    isCompleted: true,
                    note: note
                });
            } catch (e) { console.error(e) }
        }
    };

    const finishCurrentWorkout = async () => {
        if (!sessionId) return;
        try {
            await finishWorkout(sessionId, elapsedSeconds);
            setSessionId(null);
            setActiveExercises([]);
            setElapsedSeconds(0);
            startTimeRef.current = null;
            localStorage.removeItem(STORAGE_KEY);
            router.push("/history");
        } catch (error) {
            console.error("Failed to finish", error);
        }
    };

    return (
        <WorkoutContext.Provider value={{
            sessionId,
            activeExercises,
            elapsedSeconds,
            isTimerOpen,
            exercises,
            isLoading,
            startWorkout,
            addExercise,
            addSet,
            updateSetLocal,
            completeSet,
            saveNote,
            finishCurrentWorkout,
            setTimerOpen: setIsTimerOpen,
            resumeWorkout
        }}>
            {children}
        </WorkoutContext.Provider>
    );
}

export function useWorkout() {
    const context = useContext(WorkoutContext);
    if (!context) throw new Error("useWorkout must be used within a WorkoutProvider");
    return context;
}
