"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Clock, Trophy, ClipboardList, ListMusic } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

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
                    className={`flex flex-col items-center p-2 ${isActive("/workout") ? "text-primary" : "text-gray-400"
                        }`}
                >
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
