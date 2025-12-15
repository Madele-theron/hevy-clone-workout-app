import WorkoutSession from "@/components/WorkoutSession";
import { startNewWorkout } from "@/app/actions/workout";

// To handle searchParams in Next.js 14 Page
export default async function WorkoutPage({
    searchParams,
}: {
    searchParams: { routineId?: string };
}) {
    let initialSessionId: number | undefined;

    // If routineId is present, we automatically start a new session 
    // ONLY if we are visiting this page specifically to start one. 
    // However, usually GET requests shouldn't trigger mutations.
    // Best practice: The previous page (Routines) should have triggered the mutation 
    // and redirected here with ?sessionId=...
    //
    // BUT, sticking to simple flow: 
    // If `routineId` is provided, we can treat it as "Please start this routine".
    // A cleaner way is: Routines Page -> Client Component calls Server Action `startNewWorkout(routineId)` -> redirect(`/workout?sessionId=${newId}`).

    // Let's check if we have a sessionId param (from redirect) or routineId param.
    // If routineId, we'll need to start it. But we can't do that easily in Server Component without side effects on render.

    // Revised approach: 
    // `WorkoutSession` handles "New Session" logic. 
    // But strictly, we want "Start from Routine" to happen from Routines page.
    // So: Update `app/routines/page.tsx` to handle the start logic.
    // AND `app/workout/page.tsx` should accept `sessionId` prop to resume.

    // If we assume the user just clicked "Workout" tab, they see empty state.
    // If they came from "Start Routine", they should have a session ID.

    // Let's accommodate the URL params.
    if (searchParams.routineId) {
        // This is a bit "unsafe" for GET requests but functionally what was asked.
        // We will perform the action here. 
        initialSessionId = await startNewWorkout(Number(searchParams.routineId));
    }

    // NOTE: In a real app, use a Server Action + Redirect from the source page suitable for POST.
    // For this demo, we auto-start if `routineId` is in URL.

    return (
        <div className="h-full">
            <WorkoutSession initialSessionId={initialSessionId} />
        </div>
    );
}
