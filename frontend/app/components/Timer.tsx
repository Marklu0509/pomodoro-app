// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { Settings } from "../types/setting";

interface TimerProps {
  taskId: number;
  onSessionComplete: () => void;
}

// Define the 3 modes of the timer
type TimerMode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function Timer({ taskId, onSessionComplete }: TimerProps) {
  // --- State ---
  const [mode, setMode] = useState<TimerMode>("WORK");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default fallback
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionCount, setSessionCount] = useState(0); // Track pomodoros to trigger long break
  
  // Audio Refs (to prevent re-loading sounds on every render)
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- 1. Load Settings & Audio on Mount ---
  useEffect(() => {
    // Initialize Audio
    tickAudioRef.current = new Audio("/sounds/tick.mp3");
    alarmAudioRef.current = new Audio("/sounds/alarm.mp3");

    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        const userSettings: Settings = res.data;
        setSettings(userSettings);
        
        // Apply initial duration based on settings
        if (userSettings) {
           setTimeLeft(userSettings.workDuration * 60);
           // Set volumes
           if (tickAudioRef.current) tickAudioRef.current.volume = userSettings.tickVolume / 100;
           if (alarmAudioRef.current) alarmAudioRef.current.volume = userSettings.notificationVolume / 100;
        }
      } catch (err) {
        console.error("Failed to load settings in Timer", err);
      }
    };
    fetchSettings();
  }, []);

  // --- 2. Timer Logic (The Heartbeat) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        
        // Play Tick Sound (if enabled and settings loaded)
        if (settings?.tickingSound !== "none" && tickAudioRef.current) {
            // Reset time to 0 to allow rapid replay
            tickAudioRef.current.currentTime = 0; 
            tickAudioRef.current.play().catch(() => {}); // Catch error if user hasn't interacted yet
        }
      }, 1000);
    } else if (timeLeft === 0) {
      // Time is up!
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, settings]);

  // --- 3. Handle Completion & Mode Switching ---
  const handleTimerComplete = async () => {
    setIsActive(false); // Stop timer first
    
    // Play Alarm
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch((e) => console.log("Audio play failed", e));
    }

    // If it was a WORK session, record it
    if (mode === "WORK") {
      try {
        // Assume actual duration is what was set in settings
        const duration = settings ? settings.workDuration * 60 : 25 * 60;
        await api.post("/sessions", {
          durationSeconds: duration,
          taskId: taskId,
        });
        onSessionComplete(); // Refresh parent UI
        
        // Increment session count to decide Short vs Long break
        const newSessionCount = sessionCount + 1;
        setSessionCount(newSessionCount);

        // Switch to Break
        if (newSessionCount % 4 === 0) {
            switchMode("LONG_BREAK");
        } else {
            switchMode("SHORT_BREAK");
        }

      } catch (error) {
        console.error("Failed to save session", error);
      }
    } else {
      // If it was a BREAK, switch back to WORK
      switchMode("WORK");
    }
  };

  // --- Helper: Switch Mode & Apply Settings ---
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    
    if (!settings) return;

    // 1. Set Duration
    let newDuration = 25 * 60;
    if (newMode === "WORK") newDuration = settings.workDuration * 60;
    else if (newMode === "SHORT_BREAK") newDuration = settings.shortBreakDuration * 60;
    else if (newMode === "LONG_BREAK") newDuration = settings.longBreakDuration * 60;
    
    setTimeLeft(newDuration);

    // 2. Check Auto-Start
    // Only auto-start if the setting is enabled for the TARGET mode
    let shouldAutoStart = false;
    if (newMode === "WORK" && settings.autoStartPomodoros) shouldAutoStart = true;
    if ((newMode === "SHORT_BREAK" || newMode === "LONG_BREAK") && settings.autoStartBreaks) shouldAutoStart = true;

    if (shouldAutoStart) {
        setIsActive(true);
    } else {
        setIsActive(false);
    }
  };

  // --- UI Helpers ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate Progress for Circle
  const getTotalTime = () => {
    if (!settings) return 25 * 60;
    if (mode === "WORK") return settings.workDuration * 60;
    if (mode === "SHORT_BREAK") return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  };
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalTime = getTotalTime();
  const progressPercentage = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progressPercentage);

  // Colors based on mode
  const getColor = () => {
    if (mode === "WORK") return "#ef4444"; // Red for focus
    if (mode === "SHORT_BREAK") return "#3b82f6"; // Blue for break
    return "#10b981"; // Green for long break
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center">
      
      {/* Mode Indicator */}
      <div className="mb-4 px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase" 
           style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
        {mode.replace("_", " ")}
      </div>

      {/* Progress Ring */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke={getColor()} strokeWidth="6" strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s linear, stroke 0.5s ease"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold text-gray-800">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-gray-400 mt-1 uppercase font-semibold">
            {isActive ? "Running" : "Paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full px-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className="flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
          style={{ backgroundColor: isActive ? "#f59e0b" : getColor() }}
        >
          {isActive ? "PAUSE" : "START"}
        </button>
        <button
          onClick={() => {
             setIsActive(false);
             // Reset to current mode's full duration
             setTimeLeft(getTotalTime());
          }}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          RESET
        </button>
      </div>

       {/* Quick Skip (Debug feature, mostly) */}
       <button 
         onClick={handleTimerComplete}
         className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
       >
         Skip (Test Finish)
       </button>
    </div>
  );
}