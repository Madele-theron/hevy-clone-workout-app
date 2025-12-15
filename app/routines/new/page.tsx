import RoutineBuilder from "@/components/RoutineBuilder";

export const metadata = {
    title: "New Routine | Gemini",
};

export const dynamic = 'force-dynamic';


export default function NewRoutinePage() {
    return <RoutineBuilder />;
}
