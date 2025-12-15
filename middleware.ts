import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes if needed, but we want EVERYTHING public for guests.
// Except maybe explicit protected routes? User said "make all routes public".

export default clerkMiddleware(async (auth, req) => {
    // 1. Allow access to everything (no protect() call)

    // 2. Check for Guest Cookie
    const guestCookie = req.cookies.get("guest_uuid");
    const { userId } = await auth(); // Updated to await for safety if it returns promise


    // If not signed in AND no guest cookie, generate one
    if (!userId && !guestCookie) {
        const response = NextResponse.next();
        const newGuestId = `guest_${crypto.randomUUID()}`;

        response.cookies.set("guest_uuid", newGuestId, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 Year
            sameSite: "strict",
            // secure: process.env.NODE_ENV === "production" // standard
        });
        return response;
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
