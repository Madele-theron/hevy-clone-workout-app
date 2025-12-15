import { getRoutines } from "@/app/actions/routines";
import Link from "next/link";
import { Plus } from "lucide-react";
import RoutineList from "@/components/RoutineList";

export const metadata = {
    title: "Routines | IronPath",
};

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
    const routines = await getRoutines();

    return (
        <div className="pb-24 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-200">Routines</h1>
                <Link
                    href="/routines/new"
                    className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-primary/30 flex items-center"
                >
                    <Plus size={16} className="mr-1" /> New
                </Link>
            </div>

            <RoutineList initialRoutines={routines} />
        </div>
    );
}
