"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Clock, Trophy, ClipboardList, ListMusic } from "lucide-react";

import { useWorkout } from "@/contexts/WorkoutContext";

export default function BottomNav() {
    const pathname = usePathname();
    // Wrap in try-catch or optional chaining because useWorkout might throw if outside provider?
    // We just wrapped it in layout, so it should be fine.
    // However, hooks act weird if Context is not ready. But it should be.
    // Let's assume safe.

    // NOTE: If this component is rendered on server, context will fail? 
    // "use client" is at top, so it's a client component.
    const { sessionId } = useWorkout();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-800 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    href="/history"
                    className={`flex flex-col items-center p-2 ${isActive("/history") ? "text-primary" : "text-gray-400"
                        }`}
                >
                    <Clock size={24} />
                    <span className="text-xs mt-1">History</span>
                </Link>
                <Link
                    href="/workout"
                    className={`relative flex flex-col items-center p-2 ${isActive("/workout") ? "text-primary" : "text-gray-400"
                        }`}
                >
                    {sessionId && (
                        <span className="absolute top-2 right-4 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <Dumbbell size={24} />
                    <span className="text-xs mt-1">Workout</span>
                </Link>
                <Link
                    href="/routines"
                    className={`flex flex-col items-center p-2 ${isActive("/routines") ? "text-primary" : "text-gray-400"
                        }`}
                >
                    <ClipboardList size={24} />
                    <span className="text-xs mt-1">Routines</span>
                </Link>
                <Link
                    href="/exercises"
                    className={`flex flex-col items-center p-2 ${isActive("/exercises") ? "text-primary" : "text-gray-400"
                        }`}
                >
                    <ListMusic size={24} />
                    <span className="text-xs mt-1">Exercises</span>
                </Link>
            </div>
        </nav>
    );
}
