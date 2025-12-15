"use client";

import { useState } from "react";
import { WorkoutHistoryItem, deleteWorkout } from "@/app/actions/workout";
import { Calendar, Clock, Loader2, Play, Trash2 } from "lucide-react";
import Button from "./Button";
import Link from "next/link";

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
            await deleteWorkout(session.id);
            // Router refresh handled by server action revalidatePath
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-surface rounded-xl p-4 border border-transparent hover:border-gray-700 transition-colors relative group">
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                title="Delete Workout"
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
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="bg-gray-900/50 p-4 border-t border-gray-800 space-y-4 animate-slide-down">
                        {session.exercises.map((exercise, i) => (
                            <div key={i}>
                                <h4 className="text-sm font-bold text-blue-400 mb-2">{exercise.name}</h4>
                                <div className="space-y-1">
                                    {exercise.sets.map((set, j) => (
                                        <div key={j} className="grid grid-cols-3 text-xs text-gray-300 py-1 border-b border-gray-800/50 last:border-0">
                                            <span className="text-gray-500">Set {set.setNumber}</span>
                                            <span className="text-center font-mono">{set.weight} kg</span>
                                            <span className="text-right">{set.reps} reps</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            );
}
