// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";

interface TimerProps {
  taskId: number;
  onSessionComplete: () => void;
}

export default function Timer({ taskId, onSessionComplete }: TimerProps) {
  // --- Configuration ---
  // For testing, use 10 seconds. For production, change to 25 * 60 (1500).
  const FOCUS_DURATION = 10; 

  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Circle Progress Logic (The Math) ---
  const radius = 45; // Radius of the circle
  const circumference = 2 * Math.PI * radius; // 2 * π * r (approx 282.7)
  
  // Calculate how much of the circle should be visible (0 to 1)
  const progressPercentage = timeLeft / FOCUS_DURATION;
  
  // Calculate the offset:
  // If time is full (100%), offset is 0 (full circle).
  // If time is 0 (0%), offset is circumference (empty circle).
  const strokeDashoffset = circumference * (1 - progressPercentage);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(FOCUS_DURATION);
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await api.post("/sessions", {
        durationSeconds: FOCUS_DURATION,
        taskId: taskId,
      });
      alert("Pomodoro Completed! 🍅");
      onSessionComplete();
      setTimeLeft(FOCUS_DURATION);
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("Error saving session.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center">
      
      {/* --- Progress Ring Container --- */}
      <div className="relative w-48 h-48 mb-6">
        {/* SVG Wrapper - Rotated -90deg so it starts from the top (12 o'clock) */}
        <svg className="w-full h-full -rotate-270 -scale-x-100 transform" viewBox="0 0 100 100">
          
          {/* 1. Background Circle (Gray track) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb" // gray-200
            strokeWidth="6"
          />

          {/* 2. Progress Circle (Blue/Orange Indicator) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={isActive ? "#3b82f6" : "#9ca3af"} // Blue when active, Gray when paused
            strokeWidth="6"
            strokeLinecap="round" // Rounded ends for the line
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s linear" // Smoothly animate the line movement
            }}
          />
        </svg>

        {/* --- Center Text (Time Display) --- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-mono font-bold tracking-wider ${
            isActive ? "text-gray-800" : "text-gray-400"
          }`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-gray-400 mt-1 uppercase font-semibold">
            {isActive ? "Focusing" : "Paused"}
          </span>
        </div>
      </div>

      {/* --- Controls --- */}
      <div className="flex gap-4 w-full px-4">
        <button
          onClick={toggleTimer}
          disabled={isSaving}
          className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${
            isActive 
              ? "bg-amber-400 hover:bg-amber-500 text-amber-900" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isActive ? "PAUSE" : "START"}
        </button>

        <button
          onClick={resetTimer}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          RESET
        </button>
      </div>
      
      {isSaving && <p className="text-sm text-blue-500 mt-2 font-medium animate-pulse">Saving...</p>}
    </div>
  );
}