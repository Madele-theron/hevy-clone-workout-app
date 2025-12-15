"use server";

import { db } from "@/lib/db";

export async function exportData() {
    const allSets = await db.query.sets.findMany({
        with: {
            session: true,
            exercise: true,
        },
        orderBy: (sets, { desc }) => [desc(sets.createdAt)],
    });

    // CSV Header
    const header = [
        "Date",
        "Exercise Name",
        "Set Number",
        "Weight (kg)",
        "Reps",
        "Is Completed",
    ].join(",");

    // CSV Rows
    const rows = allSets.map((set) => {
        const date = set.session.startTime.toISOString().split("T")[0];
        const cleanName = set.exercise.name.replace(/,/g, ""); // Handle commas
        return [
            date,
            cleanName,
            set.setNumber,
            set.weightKg || 0,
            set.reps || 0,
            set.isCompleted ? "Yes" : "No",
        ].join(",");
    });

    return [header, ...rows].join("\n");
}
