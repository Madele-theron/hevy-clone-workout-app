"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import type { WorkoutHistoryItem } from "@/app/actions/workout";

export default function WorkoutHistoryCard({
    session,
}: {
    session: WorkoutHistoryItem;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }).format(new Date(date));
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    return (
        <div className="bg-surface rounded-xl overflow-hidden transition-all duration-200">
            {/* Header - Always Visible */}
            <div
                className="p-4 cursor-pointer hover:bg-gray-800/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-white text-lg">
                            {session.notes || "Workout"}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">
                            {formatDate(session.date)}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-400 bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                            {formatDuration(session.duration)}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        {/* Preview first 3 exercises */}
                        {session.exercises.slice(0, 3).map((ex, i) => (
                            <div key={i} className="text-xs text-gray-400">
                                {ex.sets.length} x {ex.name}
                            </div>
                        ))}
                        {session.exercises.length > 3 && (
                            <div className="text-xs text-gray-500">
                                + {session.exercises.length - 3} more
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                            <Trophy size={12} className="mr-1" />
                            {Math.round(session.volume).toLocaleString()} kg
                        </div>
                        {isExpanded ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-600" />}
                    </div>
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
