"use client";

import { useState } from "react";
import { WorkoutHistoryItem, deleteWorkout } from "@/app/actions/workout";
import { Calendar, Clock, Loader2, Trash2 } from "lucide-react";

export default function WorkoutHistoryCard({ session }: { session: WorkoutHistoryItem }) {
    const [isDeleting, setIsDeleting] = useState(false);

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
                setIsDeleting(false); // Only reset if failed, otherwise component usually unmounts/refreshes
                alert("Failed to delete. Please try again.");
            }
        }
    };

    return (
        <div className="bg-surface rounded-xl p-4 border border-transparent hover:border-gray-700 transition-colors relative group">
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                title="Delete Workout"
                type="button"
            >
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            </button>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-primary">
                    <Calendar size={24} />
                </div>
                <div>
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
            </div>

            {session.notes && (
                <div className="bg-gray-800/50 p-2 rounded-lg mb-4 text-sm text-gray-300 italic">
                    "{session.notes}"
                </div>
            )}

            <div className="space-y-1">
                {session.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">{ex.name}</span>
                        <span className="text-gray-500">{ex.sets.length} sets</span>
                    </div>
                ))}
                {session.exercises.length > 3 && (
                    <div className="text-xs text-gray-500 mt-1">
                        + {session.exercises.length - 3} more exercises
                    </div>
                )}
            </div>
        </div>
    );
}
