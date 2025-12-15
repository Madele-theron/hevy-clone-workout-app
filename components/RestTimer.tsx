"use client";

import { X, Minus, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface RestTimerProps {
    isOpen: boolean;
    onClose: () => void;
    initialTime?: number;
}

const STORAGE_KEY_TIMER = 'ironpath_timer_duration';

export default function RestTimer({
    isOpen,
    onClose,
    initialTime, // If provided (from prop), we might prioritize it, or prioritize usage preference? 
    // Usually for rest timer between sets, user has a global preference.
}: RestTimerProps) {
    const [defaultTime, setDefaultTime] = useState(60);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("60");

    // Load default time preference
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY_TIMER);
        if (saved) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed)) {
                setDefaultTime(parsed);
                if (!initialTime) setTimeLeft(parsed); // Only set if not overridden by specific prop (if we use that)
            }
        }
        if (initialTime) setTimeLeft(initialTime);
    }, [initialTime]);

    // Save default time preference whenever it changes (conceptually, when user explicitly sets it?)
    // Actually, user wants "remember last used".
    // If I use +30s, does that become the new default? Probably not.
    // Let's make "Edit Time" set the new default.

    useEffect(() => {
        if (isOpen) {
            // Reset to default time on open, unless we want to resume?
            // Simple version: Reset to default.
            setTimeLeft(defaultTime);
        }
    }, [isOpen, defaultTime]);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, timeLeft]);

    const saveDefault = (seconds: number) => {
        setDefaultTime(seconds);
        localStorage.setItem(STORAGE_KEY_TIMER, seconds.toString());
    };

    if (!isOpen) return null;

    const adjustTime = (seconds: number) => {
        setTimeLeft((prev) => Math.max(0, prev + seconds));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleEditSubmit = () => {
        const val = parseInt(editValue, 10);
        if (!isNaN(val) && val > 0) {
            setTimeLeft(val);
            saveDefault(val); // Update preference
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-gray-800 p-4 pb-safe shadow-2xl animate-slide-up">
            <div className="flex flex-col items-center max-w-md mx-auto">
                <div className="w-full flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-400">Rest Timer</span>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-gray-800 text-white text-3xl font-bold w-32 text-center rounded-lg p-2"
                            autoFocus
                        />
                        <button onClick={handleEditSubmit} className="bg-primary text-black px-4 py-2 rounded-lg font-bold">OK</button>
                    </div>
                ) : (
                    <div
                        onClick={() => {
                            setEditValue(timeLeft.toString());
                            setIsEditing(true);
                        }}
                        className="text-5xl font-mono font-bold text-primary mb-6 cursor-pointer hover:opacity-80 flex items-center gap-2"
                    >
                        {formatTime(timeLeft)}
                        <Settings size={20} className="text-gray-600 opacity-50" />
                    </div>
                )}

                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => adjustTime(-30)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                        <Minus size={18} /> 30s
                    </button>
                    <button
                        onClick={() => adjustTime(30)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus size={18} /> 30s
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-primary text-white py-3 rounded-lg font-bold"
                >
                    Skip Rest
                </button>
            </div>
        </div>
    );
}
