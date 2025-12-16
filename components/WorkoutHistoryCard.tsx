"use client";

import { useState } from "react";
import { WorkoutHistoryItem, deleteWorkout, repeatWorkout, saveSessionAsRoutine } from "@/app/actions/workout";
import { Calendar, Clock, Loader2, Trash2, ChevronDown, ChevronUp, Play, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "./Button";

export default function WorkoutHistoryCard({ session }: { session: WorkoutHistoryItem }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRepeating, setIsRepeating] = useState(false);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-";
        const m = Math.floor(seconds / 60);
        return `${m} min`;
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this workout?")) {
            setIsDeleting(true);
            try {
                await deleteWorkout(session.id);
            } catch (error) {
                console.error("Failed to delete workout:", error);
                setIsDeleting(false);
                alert("Failed to delete. Please try again.");
            }
        }
    };

    const handleRepeat = async () => {
        setIsRepeating(true);
        try {
            const newSessionId = await repeatWorkout(session.id);
            router.push(`/workout?sessionId=${newSessionId}`);
        } catch (error) {
            console.error("Failed to repeat workout:", error);
            alert("Failed to start workout. Please try again.");
            setIsRepeating(false);
        }
    };

    const handleSaveAsRoutine = async () => {
        const name = prompt("Enter routine name:", "My Routine");
        if (!name) return;

        try {
            await saveSessionAsRoutine(session.id, name);
            alert("Routine saved successfully!");
            router.push("/routines");
        } catch (error) {
            console.error("Failed to save routine:", error);
            alert("Failed to save routine. Please try again.");
        }
    };

    return (
        <div className="bg-surface rounded-xl p-4 border border-transparent hover:border-gray-700 transition-colors relative group">
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 z-10"
                title="Delete Workout"
                type="button"
            >
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            </button>

            <div
                className="cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-primary">
                        <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">Workout</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                {formatDate(session.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatDuration(session.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                                {Math.round(session.volume || 0)} kg
                            </span>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>

                {session.notes && (
                    <div className="bg-gray-800/50 p-2 rounded-lg mb-4 text-sm text-gray-300 italic">
                        {`"${session.notes}"`}
                    </div>
                )}

                <div className="space-y-1">
                    {(isExpanded ? session.exercises : session.exercises.slice(0, 3)).map((ex, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-300 font-medium">{ex.name}</span>
                            <span className="text-gray-500">{ex.sets.length} sets</span>
                        </div>
                    ))}
                    {!isExpanded && session.exercises.length > 3 && (
                        <div className="text-xs text-gray-500 mt-1">
                            + {session.exercises.length - 3} more exercises
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRepeat();
                        }}
                        disabled={isRepeating}
                        variant="ghost"
                        className="flex-1 py-2 text-sm"
                    >
                        <Play size={16} className="mr-2" />
                        {isRepeating ? "Starting..." : "Repeat Workout"}
                    </Button>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSaveAsRoutine();
                        }}
                        variant="ghost"
                        className="flex-1 py-2 text-sm"
                    >
                        <Save size={16} className="mr-2" />
                        Save as Routine
                    </Button>
                </div>
            )}
        </div>
    );
}
