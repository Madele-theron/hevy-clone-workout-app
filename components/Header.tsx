"use client";

import { UserButton } from "@clerk/nextjs";

export default function Header() {
    return (
        <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-surface sticky top-0 z-50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                Gemini Workout
            </h1>
            <UserButton afterSignOutUrl="/sign-in" />
        </header>
    );
}
