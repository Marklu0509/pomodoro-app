// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";

// Update Interface to include all profile settings
interface FocusMode {
  id: number;
  name: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  ambientVolume: number;
  ambientSound: string;
  alarmSound: string;
  alertAt25Percent: boolean; // ★ Added: Must include this for TypeScript
}

interface TimerProps {
  taskId: number | null;
  activeMode: FocusMode; 
  onSessionComplete: () => void;
}

type TimerMode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function Timer({ taskId, activeMode, onSessionComplete }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>("WORK");
  const [timeLeft, setTimeLeft] = useState(activeMode.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // 1. Setup Audio when Mode or Profile changes
  useEffect(() => {
    // Stop previous ambient audio before switching profiles
    stopAudio(ambientAudioRef.current);

    // Initialize Notification Chime
    chimeAudioRef.current = new Audio("/sounds/chime.mp3");
    chimeAudioRef.current.volume = 0.5;

    // Load Alarm
    const alarmFile = `/sounds/alarm-${activeMode.alarmSound}.mp3`;
    alarmAudioRef.current = new Audio(alarmFile);
    alarmAudioRef.current.volume = 0.7;

    // Load Ambient Sound (Tick or White Noise)
    const isTicking = activeMode.ambientSound === "ticking";
    const soundPath = isTicking ? "/sounds/tick.mp3" : `/sounds/${activeMode.ambientSound}.mp3`;
    
    ambientAudioRef.current = new Audio(soundPath);
    ambientAudioRef.current.volume = activeMode.ambientVolume / 100;
    
    if (!isTicking) {
      ambientAudioRef.current.loop = true;
    }

    // Reset timer to the new mode's duration
    setTimeLeft(activeMode.workDuration * 60);
    setMode("WORK");
    setIsActive(false);

    return () => stopAudio(ambientAudioRef.current);
  }, [activeMode]);

  // 2. Continuous Audio Control (Background Noise)
  useEffect(() => {
    const isContinuous = activeMode.ambientSound !== "none" && activeMode.ambientSound !== "ticking";
    if (isActive && isContinuous && ambientAudioRef.current && mode === "WORK") {
      ambientAudioRef.current.play().catch(() => {});
    } else {
      if (ambientAudioRef.current && isContinuous) ambientAudioRef.current.pause();
    }
  }, [isActive, mode, activeMode]);

  // 3. Core Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;

          // Milestone alerts (75%, 50%, 25% remaining)
          if (activeMode.alertAt25Percent && mode === "WORK") {
            const total = activeMode.workDuration * 60;
            const p75 = Math.floor(total * 0.75);
            const p50 = Math.floor(total * 0.50);
            const p25 = Math.floor(total * 0.25);

            if (nextTime === p75 || nextTime === p50 || nextTime === p25) {
               if (chimeAudioRef.current) {
                 chimeAudioRef.current.currentTime = 0;
                 chimeAudioRef.current.play().catch(() => {});
               }
            }
          }
          
          if (nextTime <= 0) {
            if (activeMode.ambientSound === "ticking") stopAudio(ambientAudioRef.current);
            return 0;
          }
          return nextTime;
        });

        // Ticking Sound logic
        if (timeLeft > 1 && activeMode.ambientSound === "ticking" && ambientAudioRef.current) {
            ambientAudioRef.current.currentTime = 0;
            ambientAudioRef.current.play().catch(() => {}); 
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, activeMode, mode]);

  const handleTimerComplete = async () => {
    stopAudio(ambientAudioRef.current);
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play();
      setTimeout(() => stopAudio(alarmAudioRef.current), 5000);
    }

    if (mode === "WORK") {
      await api.post("/sessions", { durationSeconds: activeMode.workDuration * 60, taskId });
      onSessionComplete();
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      const isLongBreak = newCount % 4 === 0;
      setMode(isLongBreak ? "LONG_BREAK" : "SHORT_BREAK");
      setTimeLeft(isLongBreak ? activeMode.longBreakDuration * 60 : activeMode.shortBreakDuration * 60);
    } else {
      setMode("WORK");
      setTimeLeft(activeMode.workDuration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getColor = () => {
    if (mode === "WORK") return "#ef4444";
    if (mode === "SHORT_BREAK") return "#3b82f6";
    return "#10b981"; 
  };

  // Helper for progress circle
  const getInitialTime = () => {
    if (mode === "WORK") return activeMode.workDuration * 60;
    if (mode === "SHORT_BREAK") return activeMode.shortBreakDuration * 60;
    return activeMode.longBreakDuration * 60;
  };

  return (
    <div className="mt-4 p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col items-center relative transition-all duration-300">
      
      {/* Mode Indicator Text */}
      <div className="text-xs font-black tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-2">
        Focus Mode ({mode})
      </div>

      {/* Active Profile Name */}
      <div className="mb-6 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm" 
           style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
        {activeMode.name}
      </div>

      {/* Progress Ring */}
      <div className="relative w-56 h-56 mb-8">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="5" className="dark:stroke-gray-700" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={getColor()} strokeWidth="5" strokeLinecap="round"
            style={{
              strokeDasharray: 282.7,
              strokeDashoffset: 282.7 * (1 - timeLeft / getInitialTime()),
              transition: "stroke-dashoffset 1s linear"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-mono font-bold text-gray-800 dark:text-gray-100">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full px-6">
        <button
          type="button" 
          onClick={() => setIsActive(!isActive)}
          className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all"
          style={{ backgroundColor: isActive ? "#f59e0b" : getColor() }}
        >
          {isActive ? "PAUSE" : "START"}
        </button>
        <button
          type="button" 
          onClick={() => { setIsActive(false); stopAudio(ambientAudioRef.current); setTimeLeft(getInitialTime()); }}
          className="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          RESET
        </button>
      </div>

      <button
         type="button"
         onClick={() => setTimeLeft(2)}
         className="mt-6 text-[10px] text-gray-300 hover:text-red-400 cursor-pointer transition-colors"
       >
         Test Finish (2s left)
       </button>
    </div>
  );
}