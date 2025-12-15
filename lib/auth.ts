import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export async function getUserId() {
    // 1. Check if user is authenticated with Clerk
    const { userId } = await auth();
    if (userId) return userId;

    // 2. Check for Guest Cookie
    const guestCookie = cookies().get("guest_uuid");
    if (guestCookie && guestCookie.value) {
        return guestCookie.value;
    }

    // 3. Fallback (Should be handled by middleware, but safe to throw)
    throw new Error("Unauthorized: No user or guest session found.");
}
