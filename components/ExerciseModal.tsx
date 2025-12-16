"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import Button from "./Button";

type Exercise = {
    id: number;
    name: string;
    type?: string;
    notes?: string | null;
};

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercise?: Exercise;
    onSave: (data: { name: string; type?: string; notes?: string }) => Promise<void>;
    onDelete?: (id: number) => Promise<void>;
}

export default function ExerciseModal({ isOpen, onClose, exercise, onSave, onDelete }: ExerciseModalProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState("strength");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (exercise) {
                setName(exercise.name);
                setType(exercise.type || "strength");
                setNotes(exercise.notes || "");
            } else {
                setName("");
                setType("strength");
                setNotes("");
            }
        }
    }, [isOpen, exercise]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name.trim()) return alert("Name is required");

        setIsSubmitting(true);
        try {
            await onSave({ name, type, notes });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to save exercise");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!exercise || !onDelete) return;
        if (!confirm("Are you sure you want to delete this exercise? This cannot be undone.")) return;

        setIsSubmitting(true);
        try {
            await onDelete(exercise.id);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to delete exercise");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-lg rounded-2xl p-6 space-y-6 sm:mb-0 mb-safe animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">
                        {exercise ? "Edit Exercise" : "New Exercise"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-medium">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Bench Press"
                            className="w-full bg-gray-800 p-3 rounded-lg text-white font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2 font-medium">Tracking Type</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setType("strength")}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all ${type === "strength"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                                    }`}
                            >
                                <div className="font-bold text-sm">Reps</div>
                                <div className="text-xs opacity-75">Weight × Reps</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("duration")}
                                className={`flex-1 p-3 rounded-lg border-2 transition-all ${type === "duration"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                                    }`}
                            >
                                <div className="font-bold text-sm">Duration</div>
                                <div className="text-xs opacity-75">Time-based</div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1 font-medium">Notes / Tips (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Keep elbows tucked..."
                            className="w-full bg-gray-800 p-3 rounded-lg text-white h-24 text-sm focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    {exercise && onDelete && (
                        <Button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="w-full py-4 text-lg font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                            Delete
                        </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-4 text-lg font-bold">
                        <Save size={20} className="mr-2" />
                        {isSubmitting ? "Saving..." : "Save Exercise"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
