"use client";

import { X, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface RestTimerProps {
    isOpen: boolean;
    onClose: () => void;
    initialTime?: number;
}

export default function RestTimer({
    isOpen,
    onClose,
    initialTime = 60,
}: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(initialTime);
        }
    }, [isOpen, initialTime]);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, timeLeft]);

    if (!isOpen) return null;

    const adjustTime = (seconds: number) => {
        setTimeLeft((prev) => Math.max(0, prev + seconds));
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
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

                <div className="text-5xl font-mono font-bold text-primary mb-6">
                    {formatTime(timeLeft)}
                </div>

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
