"use client";

import { Play, Square, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface StopwatchInputProps {
    value: string;
    onChange: (val: string) => void;
}

export default function StopwatchInput({ value, onChange }: StopwatchInputProps) {
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Parse current value to seconds if possible, for internal timer sync?
    // User might type "45", timer should maybe start from 0 or 45?
    // Usually timer starts from 0 for a new set.
    // If I click Play, I expect it to start counting up.
    // Let's assume we maintain `seconds` state.

    // If value changes externally (e.g. from DB), we don't necessarily update timer unless we want to resume?
    // Simple approach: Timer counts up. When stopped, it overwrites value.
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    // Update parent value every tick? Or only on stop? 
    // Updating every tick causes re-renders of parent. 
    // Maybe update visual here, commit to parent on Stop/Pause?
    // "Click 'Stop': Pauses the timer and auto-fills the input" -> implies commit on stop.
    // AND: "User can still type '60' manually".

    // Let's update the input value in real-time if timer is running, so user sees it in the input field?
    // Or show a separate timer display?
    // Prompt: "Replace the Reps input with a 'Time' input group... Stopwatch Button... Click 'Play': Starts local timer... Click 'Stop': Pauses... auto-fills input."

    useEffect(() => {
        if (isRunning) {
            onChange(`${seconds}s`);
        }
    }, [seconds, isRunning, onChange]);

    const toggleTimer = () => {
        if (isRunning) {
            setIsRunning(false);
        } else {
            // Reset seconds if starting from "0s" or empty?
            // If value is manually typed "60", do we start from 60?
            // Let's try to parse start time from current input
            const current = parseInt(value.replace(/s/i, "")) || 0;
            setSeconds(current);
            setIsRunning(true);
        }
    };

    return (
        <div className="relative w-full h-11">
            <input
                type="text"
                placeholder="0s"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full h-full bg-gray-800 rounded text-center text-lg font-bold text-white focus:ring-2 focus:ring-primary outline-none pr-8 ${isRunning ? "text-green-400" : ""}`}
            />
            <button
                onClick={toggleTimer}
                className={`absolute right-1 top-1 bottom-1 w-8 flex items-center justify-center rounded text-gray-400 hover:text-white ${isRunning ? "text-yellow-400 animate-pulse" : ""}`}
            >
                {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
        </div>
    );
}
