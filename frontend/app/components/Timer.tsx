// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { Settings } from "../types/setting";

interface TimerProps {
  taskId: number;
  onSessionComplete: () => void;
}

type TimerMode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function Timer({ taskId, onSessionComplete }: TimerProps) {
  // State
  const [mode, setMode] = useState<TimerMode>("WORK");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  // Audio Refs
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Init
  useEffect(() => {
    tickAudioRef.current = new Audio("/sounds/tick.mp3");
    alarmAudioRef.current = new Audio("/sounds/alarm.mp3");

    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        const userSettings: Settings = res.data;
        setSettings(userSettings);
        if (userSettings) {
           setTimeLeft(userSettings.workDuration * 60);
           if (tickAudioRef.current) tickAudioRef.current.volume = userSettings.tickVolume / 100;
           if (alarmAudioRef.current) alarmAudioRef.current.volume = userSettings.notificationVolume / 100;
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          // if next sec in 0
          if (prev <= 1) {
            // ★ FIX 1: Stop tick immediately when time hits 0
            if (tickAudioRef.current) {
                tickAudioRef.current.pause();
                tickAudioRef.current.currentTime = 0;
            }
            return 0;
          }
          return prev - 1;
        });

        // Play Tick (Only if time > 1 to avoid ticking at 00:00)
        if (timeLeft > 1 && settings?.tickingSound !== "none" && tickAudioRef.current) {
            tickAudioRef.current.currentTime = 0;
            tickAudioRef.current.play().catch(() => {}); 
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Time is officially up
      setIsActive(false);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, settings]);

  // 3. Handle Complete
  const handleTimerComplete = async () => {
    // ★ FIX 2: Play Alarm for fixed 5 seconds
    if (alarmAudioRef.current) {
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current.play().catch((e) => console.log("Audio play failed", e));
      
      // Stop after 5 seconds
      setTimeout(() => {
        if (alarmAudioRef.current) {
            alarmAudioRef.current.pause();
            alarmAudioRef.current.currentTime = 0;
        }
      }, 5000);
    }

    if (mode === "WORK") {
      // WORK FINISHED
      try {
        const duration = settings ? settings.workDuration * 60 : 25 * 60;
        await api.post("/sessions", {
          durationSeconds: duration,
          taskId: taskId,
        });
        
        // Notify parent to update task list (check completion)
        onSessionComplete(); 

        // Update Session Count
        const newCount = sessionCount + 1;
        setSessionCount(newCount);

        // ★ FIX 4: Switch to Break (Logic Check)
        if (newCount % 4 === 0) {
            switchMode("LONG_BREAK");
        } else {
            switchMode("SHORT_BREAK");
        }

      } catch (error) {
        console.error("Failed to save session", error);
      }
    } else {
      // BREAK FINISHED -> Back to WORK
      switchMode("WORK");
    }
  };

  // 4. Mode Switcher
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    
    if (!settings) return;

    let newDuration = 25 * 60;
    if (newMode === "WORK") newDuration = settings.workDuration * 60;
    else if (newMode === "SHORT_BREAK") newDuration = settings.shortBreakDuration * 60;
    else if (newMode === "LONG_BREAK") newDuration = settings.longBreakDuration * 60;
    
    setTimeLeft(newDuration);

    // Auto-Start Logic
    let shouldAutoStart = false;
    // If switching TO work, check autoStartPomodoros
    if (newMode === "WORK" && settings.autoStartPomodoros) shouldAutoStart = true;
    // If switching TO break, check autoStartBreaks
    if ((newMode === "SHORT_BREAK" || newMode === "LONG_BREAK") && settings.autoStartBreaks) shouldAutoStart = true;

    if (shouldAutoStart) {
        // Small delay to ensure state updates
        setTimeout(() => setIsActive(true), 100);
    } else {
        setIsActive(false);
    }
  };

  // UI Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  const getColor = () => {
    if (mode === "WORK") return "#ef4444";
    if (mode === "SHORT_BREAK") return "#3b82f6";
    return "#10b981"; 
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center">
      
      <div className="mb-4 px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase" 
           style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
        {mode.replace("_", " ")}
      </div>

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
             setTimeLeft(getTotalTime());
          }}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          RESET
        </button>
      </div>

      {/* Debug: Skip Button */}
       <button 
         onClick={() => setTimeLeft(2)} 
         className="mt-4 text-xs text-gray-300 hover:text-gray-500"
       >
         Test Finish (Set to 2s)
       </button>
    </div>
  );
}