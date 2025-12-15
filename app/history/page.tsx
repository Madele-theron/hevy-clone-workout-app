import { getWorkoutHistory } from "@/app/actions/workout";
import ExportButton from "@/components/ExportButton";
import WorkoutHistoryCard from "@/components/WorkoutHistoryCard";

export const metadata = {
    title: "History | Gemini",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
    const sessions = await getWorkoutHistory();

    return (
        <div className="pb-24 space-y-6">
            <h1 className="text-xl font-bold text-gray-200">History</h1>

            {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <p>No workouts recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <WorkoutHistoryCard key={session.id} session={session} />
                    ))}
                </div>
            )}

            <ExportButton />
        </div>
    );
}
