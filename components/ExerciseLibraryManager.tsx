"use client";

import { useState } from "react";
import { Search, Plus, Pencil } from "lucide-react";
import { createExercise, updateExercise, deleteExercise } from "@/app/actions/workout";
import ExerciseModal from "./ExerciseModal";

type Exercise = {
    id: number;
    name: string;
    notes: string | null;
    type: string;
};

export default function ExerciseLibraryManager({ initialExercises }: { initialExercises: Exercise[] }) {
    const [exercises, setExercises] = useState(initialExercises);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (data: { name: string; notes?: string }) => {
        // Optimistic update could go here, but for simplicity we'll just wait for server action
        // Actually, since we need the ID, fetching fresh list is safer or returning new item from action.
        // Let's rely on server action to revalidate path, but for client state update we need the new item.
        // Simplified: Reload page or simpler: Server Action returns new list? 
        // Best: Server Action revalidates, we rely on router.refresh() or just simple state append if we returned the item.

        // Let's make createExercise return the new item.
        const newExercise = await createExercise({ name: data.name, notes: data.notes });
        setExercises([...exercises, { ...newExercise, notes: newExercise.notes || null }]);
    };

    const handleUpdate = async (data: { name: string; notes?: string }) => {
        if (!editingExercise) return;
        await updateExercise(editingExercise.id, data);

        setExercises(exercises.map(ex =>
            ex.id === editingExercise.id ? { ...ex, name: data.name, notes: data.notes || null } : ex
        ));
    };

    const handleDelete = async (id: number) => {
        const result = await deleteExercise(id);
        if (result.success) {
            setExercises(exercises.filter(ex => ex.id !== id));
        } else {
            alert(result.error);
        }
    };

    const openCreate = () => {
        setEditingExercise(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (ex: Exercise) => {
        setEditingExercise(ex);
        setIsModalOpen(true);
    };

    return (
        <div className="pb-24 space-y-4">
            {/* Sticky Search Header */}
            <div className="sticky top-0 bg-background z-40 py-2 border-b border-gray-800 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full bg-gray-800 pl-10 pr-4 py-3 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <button
                    onClick={openCreate}
                    className="bg-primary/20 text-primary px-4 rounded-xl flex items-center justify-center hover:bg-primary/30 min-w-[50px]"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="space-y-2">
                {filteredExercises.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        No exercises found.
                    </div>
                ) : (
                    filteredExercises.map(ex => (
                        <div
                            key={ex.id}
                            onClick={() => openEdit(ex)}
                            className="bg-surface p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                            <div>
                                <h3 className="font-bold text-white mb-1">{ex.name}</h3>
                                {ex.notes && <p className="text-xs text-gray-400 line-clamp-1">{ex.notes}</p>}
                            </div>
                            <Pencil size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                        </div>
                    ))
                )}
            </div>

            <ExerciseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exercise={editingExercise}
                onSave={editingExercise ? handleUpdate : handleCreate}
                onDelete={editingExercise ? handleDelete : undefined}
            />
        </div>
    );
}
