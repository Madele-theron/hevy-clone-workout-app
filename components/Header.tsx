"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function Header() {
    return (
        <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-surface sticky top-0 z-50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                IronPath
            </h1>
            <div>
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="bg-primary text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </header>
    );
}
